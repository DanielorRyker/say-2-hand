/**
 * Migration script để thêm normalized fields cho posts hiện có
 * Chạy script này sau khi deploy code mới
 */

import { connect } from 'mongoose';

// Helper function để chuyển đổi tiếng Việt có dấu sang không dấu
function removeVietnameseTones(str: string): string {
  if (!str) return '';

  str = str.toLowerCase();

  const from =
    'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ';
  const to =
    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiioooooooooooooooouuuuuuuuuuuyyyyyd';

  for (let i = 0; i < from.length; i++) {
    str = str.replace(new RegExp(from[i], 'g'), to[i]);
  }

  return str;
}

async function migratePostsNormalizedFields() {
  try {
    // Kết nối MongoDB
    const MONGODB_URI =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/say2hand';
    console.log('🔌 Connecting to MongoDB...');
    await connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = (await import('mongoose')).connection.db;
    if (!db) {
      throw new Error('Database connection is not established');
    }
    const postsCollection = db.collection('posts');

    console.log('📊 Fetching posts...');
    const posts = await postsCollection.find({}).toArray();
    console.log(`📝 Found ${posts.length} posts to migrate`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const post of posts) {
      const updateFields: Record<string, string> = {};

      // Chỉ update nếu chưa có normalized fields
      if (
        post.title &&
        typeof post.title === 'string' &&
        !post.title_normalized
      ) {
        updateFields.title_normalized = removeVietnameseTones(post.title);
      }

      if (
        post.description &&
        typeof post.description === 'string' &&
        !post.description_normalized
      ) {
        updateFields.description_normalized = removeVietnameseTones(
          post.description,
        );
      }

      if (Object.keys(updateFields).length > 0) {
        await postsCollection.updateOne(
          { _id: post._id },
          { $set: updateFields },
        );
        updatedCount++;

        if (updatedCount % 100 === 0) {
          console.log(`⏳ Đã xử lý ${updatedCount} posts...`);
        }
      } else {
        skippedCount++;
      }
    }

    console.log('\n✅ Migration hoàn thành!');
    console.log(`   📊 Tổng số posts: ${posts.length}`);
    console.log(`   ✅ Đã cập nhật: ${updatedCount}`);
    console.log(`   ⏭️  Đã bỏ qua: ${skippedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration thất bại:', error);
    process.exit(1);
  }
}

// Chạy migration
void migratePostsNormalizedFields();
