const pool = require('../config/db');

exports.createSale = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { items } = req.body; // Array of { product_id, quantity }
        const user_id = req.user.id;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'La venta debe contener productos' });
        }

        let totalAmount = 0;
        const processedItems = [];

        // Check stock and calculate total
        for (const item of items) {
            const [products] = await connection.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [item.product_id]);
            
            if (products.length === 0) {
                throw new Error(`Producto ID ${item.product_id} no encontrado`);
            }

            const product = products[0];

            if (product.stock < item.quantity) {
                throw new Error(`Stock insuficiente para ${product.name}`);
            }

            const itemPrice = product.price * item.quantity;
            totalAmount += itemPrice;

            processedItems.push({
                product_id: item.product_id,
                name: product.name,
                quantity: item.quantity,
                price: product.price
            });

            // Decrease stock
            await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
        }

        // Insert sale
        let desc = processedItems.map(i => `${i.quantity}x ${i.name}`).join(', ');
        if(desc.length > 255) desc = desc.substring(0, 252) + '...';

        const [saleResult] = await connection.query(
            'INSERT INTO sales (user_id, total_amount, description) VALUES (?, ?, ?)',
            [user_id, totalAmount, desc]
        );

        const saleId = saleResult.insertId;

        // Insert sale items
        for (const item of processedItems) {
            await connection.query(
                'INSERT INTO sale_items (sale_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)',
                [saleId, item.product_id, item.quantity, item.price]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Venta registrada con éxito', saleId });

    } catch (error) {
        await connection.rollback();
        res.status(400).json({ message: error.message });
    } finally {
        connection.release();
    }
};

exports.getDailySales = async (req, res) => {
    try {
        const { date } = req.query; // format YYYY-MM-DD
        let queryDate = new Date().toISOString().split('T')[0];
        
        if (date) queryDate = date;

        const [sales] = await pool.query(
            `SELECT s.id, s.total_amount, s.sale_date, s.description, u.name as admin_name 
             FROM sales s 
             LEFT JOIN users u ON s.user_id = u.id 
             WHERE DATE(s.sale_date) = ?
             ORDER BY s.sale_date DESC`,
            [queryDate]
        );

        const [total] = await pool.query(
            'SELECT SUM(total_amount) as total FROM sales WHERE DATE(sale_date) = ?',
            [queryDate]
        );

        res.json({
            date: queryDate,
            total: total[0].total || 0,
            sales
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sales', error: error.message });
    }
};
