module.exports = (sequelize, Sequelize) => {
    const Incident = sequelize.define("incidents", {
        title: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        published: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        year: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        type: {
            type: Sequelize.STRING,
            allowNull: true
        },
        status: {
            type: Sequelize.STRING,
            allowNull: true
        },
        date: {
            type: Sequelize.DATE,
            allowNull: true
        }
    }, {
        timestamps: true,
        underscored: true 
    });

    return Incident;
};