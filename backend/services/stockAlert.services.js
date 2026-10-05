import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { sendMail } from "../utils/mailer.js";

/*
  Only Admin and Manager get stock alerts - Cashier/Staff/Employee don't
  need to be notified about inventory levels.
*/
const getAlertRecipients = async () => {
    const recipients = await User.find({
        role: { $in: ["admin", "manager"] },
    }).select("email");

    return recipients.map((user) => user.email).filter(Boolean);
};

const buildLowStockEmail = (product) => ({
    subject: `Low Stock Alert: ${product.name}`,
    html: `
        <h2>Low Stock Alert</h2>
        <p>The following product is running low on stock:</p>
        <table cellpadding="6" style="border-collapse: collapse;">
            <tr><td><strong>Product</strong></td><td>${product.name}</td></tr>
            <tr><td><strong>SKU</strong></td><td>${product.sku}</td></tr>
            <tr><td><strong>Category</strong></td><td>${product.category?.name || "N/A"}</td></tr>
            <tr><td><strong>Remaining Stock</strong></td><td>${product.quantityInStock} ${product.unit}</td></tr>
            <tr><td><strong>Reorder Level</strong></td><td>${product.reorderLevel} ${product.unit}</td></tr>
        </table>
        <p>Please restock this product soon.</p>
    `,
});

const buildOutOfStockEmail = (product) => ({
    subject: `Out of Stock: ${product.name}`,
    html: `
        <h2>Out of Stock Alert</h2>
        <p>The following product has completely run out of stock:</p>
        <table cellpadding="6" style="border-collapse: collapse;">
            <tr><td><strong>Product</strong></td><td>${product.name}</td></tr>
            <tr><td><strong>SKU</strong></td><td>${product.sku}</td></tr>
            <tr><td><strong>Category</strong></td><td>${product.category?.name || "N/A"}</td></tr>
        </table>
        <p>Immediate restocking is required to avoid missed sales.</p>
    `,
});

const getStockAlertType = (product) => {
    if (!product) return null;

    if (product.quantityInStock === 0) {
        return "out-of-stock";
    }

    if (product.quantityInStock <= product.reorderLevel) {
        return "low-stock";
    }

    return null;
};

/*
  checkAndSendStockAlerts

  Called AFTER a sale's transaction has already committed - this function
  is intentionally separate from the sale-creation flow itself. It
  re-fetches each sold product fresh (to see the true post-sale stock
  level and the alert flags), and sends an email only the FIRST time a
  product crosses a threshold - not on every sale after that, which
  would otherwise spam Admin/Manager inboxes with repeat alerts for a
  product that's already known to be low.
*/
const checkAndSendStockAlerts = async (saleItems) => {
    const recipients = await getAlertRecipients();
    if (recipients.length === 0) return;

    for (const item of saleItems) {
        const product = await Product.findById(item.product).populate(
            "category",
            "name",
        );
        if (!product) continue;

        const alertType = getStockAlertType(product);
        if (!alertType) continue;

        if (alertType === "out-of-stock" && !product.outOfStockAlertSent) {
            const { subject, html } = buildOutOfStockEmail(product);
            await sendMail({ to: recipients, subject, html });

            product.outOfStockAlertSent = true;
            product.lowStockAlertSent = true; // out of stock implies low stock too
            await product.save({ validateBeforeSave: false });
            continue;
        }

        if (
            alertType === "low-stock" &&
            !product.lowStockAlertSent &&
            product.quantityInStock > 0
        ) {
            const { subject, html } = buildLowStockEmail(product);
            await sendMail({ to: recipients, subject, html });

            product.lowStockAlertSent = true;
            await product.save({ validateBeforeSave: false });
        }
    }
};

export { checkAndSendStockAlerts, getStockAlertType };