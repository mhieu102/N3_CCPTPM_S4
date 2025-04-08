const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
    // Tạo MongoDB server ảo
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // Kết nối Mongoose với MongoDB ảo
    await mongoose.connect(uri); // Xóa các tùy chọn deprecated
});

afterAll(async () => {
    // Ngắt kết nối và dừng MongoDB server
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    // Xóa tất cả dữ liệu sau mỗi test để tránh ảnh hưởng
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }
});