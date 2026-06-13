const pool = require('../config/db');

exports.createSale = async (req, res) => {
    // En PostgreSQL las transacciones se hacen con un client dedicado
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { items } = req.body; // Array de { product_id, quantity }
        const user_id = req.user.id;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'La venta debe contener productos' });
        }

        let totalAmount = 0;
        const processedItems = [];

        // Verificar stock y calcular total
        for (const item of items) {
            const productResult = await client.query(
                'SELECT * FROM products WHERE id = $1 FOR UPDATE',
                [item.product_id]
            );

            if (productResult.rows.length === 0) {
                throw new Error(`Producto ID ${item.product_id} no encontrado`);
            }

            const product = productResult.rows[0];

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

            // Descontar stock
            await client.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2',
                [item.quantity, item.product_id]
            );
        }

        // Construir descripción
        let desc = processedItems.map(i => `${i.quantity}x ${i.name}`).join(', ');
        if (desc.length > 255) desc = desc.substring(0, 252) + '...';

        // Insertar venta y obtener ID
        const saleResult = await client.query(
            'INSERT INTO sales (user_id, total_amount, description) VALUES ($1, $2, $3) RETURNING id',
            [user_id, totalAmount, desc]
        );

        const saleId = saleResult.rows[0].id;

        // Insertar items de la venta
        for (const item of processedItems) {
            await client.query(
                'INSERT INTO sale_items (sale_id, product_id, quantity, price_at_time) VALUES ($1, $2, $3, $4)',
                [saleId, item.product_id, item.quantity, item.price]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Venta registrada con éxito', saleId });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: error.message });
    } finally {
        client.release();
    }
};

exports.getDailySales = async (req, res) => {
    try {
        const { date } = req.query;
        const queryDate = date || new Date().toISOString().split('T')[0];

        const salesResult = await pool.query(
            `SELECT s.id, s.total_amount, s.sale_date, s.description, u.name as admin_name
             FROM sales s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE DATE(s.sale_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/La_Paz') = $1
             ORDER BY s.sale_date DESC`,
            [queryDate]
        );

        const totalResult = await pool.query(
            "SELECT SUM(total_amount) as total FROM sales WHERE DATE(sale_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/La_Paz') = $1",
            [queryDate]
        );

        res.json({
            date: queryDate,
            total: totalResult.rows[0].total || 0,
            sales: salesResult.rows
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sales', error: error.message });
    }
};
