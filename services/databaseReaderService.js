const fs = require('fs');
const path = require('path');

class DatabaseReaderService {
    constructor() {
        this.models = {};
        this.loadModels();
    }

    /**
     * Tự động tải tất cả các model từ thư mục models
     */
    loadModels() {
        const modelsPath = path.join(__dirname, '../models');
        const modelFiles = fs.readdirSync(modelsPath).filter(file => file.endsWith('.js'));

        for (const file of modelFiles) {
            const modelName = file.replace('.js', '');
            const model = require(`../models/${modelName}`);
            this.models[modelName] = model;
        }
    }

    /**
     * Lấy dữ liệu từ tất cả các model
     */
    async getAllData() {
        const data = {};

        for (const modelName in this.models) {
            try {
                const model = this.models[modelName];
                data[modelName.toLowerCase()] = await model.find().lean();
            } catch (error) {
                console.error(`Error fetching data from model ${modelName}: ${error.message}`);
                data[modelName.toLowerCase()] = [];
            }
        }

        return data;
    }

    /**
     * Tạo tóm tắt dữ liệu từ tất cả các model
     */
    async getDataSummary() {
        const data = await this.getAllData();
        let summary = "Database Summary:\n";

        for (const modelName in data) {
            summary += `Total ${modelName.charAt(0).toUpperCase() + modelName.slice(1)}: ${data[modelName].length}\n`;
        }

        return summary;
    }

    /**
     * Lấy dữ liệu liên quan dựa trên câu hỏi
     */
    async getRelevantData(question) {
        const data = await this.getAllData();
        const relevantData = {};

        const questionLower = question.toLowerCase();

        for (const modelName in this.models) {
            const modelNameLower = modelName.toLowerCase();
            if (questionLower.includes(modelNameLower)) {
                relevantData[modelNameLower] = data[modelNameLower];
            }
        }

        // Nếu không tìm thấy dữ liệu liên quan, trả về toàn bộ dữ liệu
        return Object.keys(relevantData).length > 0 ? relevantData : data;
    }
}

module.exports = new DatabaseReaderService();