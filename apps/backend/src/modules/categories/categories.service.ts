import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Model, Types } from 'mongoose';
import { GeminiService } from '../gemini/gemini.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
    private geminiService: GeminiService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { name, image, icon, parent_id } = createCategoryDto;
    const slug = slugify(name);

    // Validate parent_id nếu có
    if (parent_id && parent_id !== '') {
      if (!Types.ObjectId.isValid(parent_id)) {
        throw new NotFoundException('Invalid parent category ID');
      }
      const parentCategory = await this.categoryModel.findById(parent_id);
      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const category = await this.categoryModel.create({
      name,
      slug,
      image,
      icon: icon || null,
      parent_id: parent_id && parent_id !== '' ? parent_id : null,
    });
    return { _id: category._id };
  }

  // Task 46: Cache categories list (rarely changes)
  async findAll() {
    const cacheKey = 'categories:all';
    const cached = await this.cacheManager.get<Category[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const categories = await this.categoryModel
      .find()
      .populate('parent_id', 'name slug icon')
      .lean()
      .exec();

    // Cache for 30 minutes (categories don't change often)
    await this.cacheManager.set(cacheKey, categories, 1800000);

    return categories;
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid category ID');
    }

    const cacheKey = `category:${id}`;
    const cached = await this.cacheManager.get<Category>(cacheKey);

    if (cached) {
      return cached;
    }

    const category = await this.categoryModel
      .findById(id)
      .populate('parent_id', 'name slug icon')
      .lean()
      .exec();

    if (category) {
      // Cache for 30 minutes
      await this.cacheManager.set(cacheKey, category, 1800000);
    }

    return category;
  }

  async update(updateCategoryDto: UpdateCategoryDto) {
    const { _id, parent_id, icon } = updateCategoryDto;

    // Invalidate cache khi update
    await this.cacheManager.del('categories:all');
    await this.cacheManager.del(`category:${_id}`);

    // Không cho phép set parent_id là chính nó
    if (parent_id && parent_id === _id) {
      throw new NotFoundException('Category cannot be its own parent');
    }

    // Validate parent_id nếu có
    if (parent_id && parent_id !== '') {
      if (!Types.ObjectId.isValid(parent_id)) {
        throw new NotFoundException('Invalid parent category ID');
      }
      const parentCategory = await this.categoryModel.findById(parent_id);
      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }
    }

    return this.categoryModel.updateOne(
      { _id: updateCategoryDto._id },
      {
        name: updateCategoryDto.name,
        slug: slugify(updateCategoryDto.name),
        image: updateCategoryDto.image,
        icon: icon || null,
        parent_id: parent_id && parent_id !== '' ? parent_id : null,
      },
    );
  }

  async remove(id: string) {
    // Kiểm tra xem có danh mục con nào không
    const childCategories = await this.categoryModel.find({ parent_id: id });
    if (childCategories.length > 0) {
      throw new NotFoundException(
        'Cannot delete category with subcategories. Please delete subcategories first.',
      );
    }
    return this.categoryModel.findByIdAndDelete(id).exec();
  }

  /**
   * Gọi AI để gợi ý icon phù hợp cho tên danh mục
   */
  async suggestIcon(name: string): Promise<string> {
    return this.geminiService.suggestIcon(name);
  }
}

function slugify(input: string): string {
  return input
    .normalize('NFD') // tách dấu
    .replace(/[\u0300-\u036f]/g, '') // xoá dấu tổ hợp
    .replace(/đ/g, 'd') // xử lý chữ đ
    .replace(/Đ/g, 'd') // xử lý chữ Đ
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // space -> -
    .replace(/[^a-z0-9-]/g, '') // loại ký tự đặc biệt
    .replace(/-+/g, '-'); // gộp nhiều -
}
