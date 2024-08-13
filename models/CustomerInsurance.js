const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const CustomerInsurance = db.define('customerchoice', {
    planName: {
        type: Sequelize.STRING, allowNull: false
    },
    planCategory: {
        type: Sequelize.STRING, allowNull: false
    },
    featName: {
        type: Sequelize.STRING, allowNull: false
    },
    featCost: {
        type: Sequelize.DECIMAL(10, 2), allowNull: false
    },
    featDescription: {
        type: Sequelize.STRING, allowNull: true
    },
    optionalfeat: {
        type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false
    },
    totalCost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    userId: {
        type: Sequelize.INTEGER, allowNull: false
    }
});

// Function to update totalCost based on sum of featCost where planName is the same and optionalfeat is false
async function updateTotalCost() {
    try {
        const results = await CustomerInsurance.findAll({
            attributes: ['planName', [Sequelize.fn('SUM', Sequelize.col('featCost')), 'totalFeatCost']],
            where: {
                optionalfeat: false
            },
            group: ['planName'],
            raw: true
        });

        // Update totalCost in each instance of CustomerInsurance based on the sum of featCost
        await Promise.all(results.map(async (result) => {
            const { planName, totalFeatCost } = result;
            await CustomerInsurance.update(
                { totalCost: totalFeatCost },
                { where: { planName: planName } }
            );
        }));

        console.log('Total cost updated successfully');
    } catch (error) {
        console.error('Error updating total cost:', error);
        throw error; // Propagate the error to handle it further up the call stack
    }
}

module.exports = {
    CustomerInsurance,
    updateTotalCost
};