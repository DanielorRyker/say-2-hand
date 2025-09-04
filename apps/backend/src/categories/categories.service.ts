import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class CategoriesService {
    constructor(
      @InjectModel(Category.name)
      private categoryModel: Model<CategoryDocument>,
    ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { name } = createCategoryDto;
    const slug = slugify(name);
    const category = await this.categoryModel.create({ name, slug });
    return { _id: category._id };
  }

  findAll() {
    return this.categoryModel.find().exec();
  }

  findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
          throw new NotFoundException('Invalid category ID');
        }
    return this.categoryModel.findById(id).exec();
  }


  
   async update(updateCategoryDto: UpdateCategoryDto) {
      return this.categoryModel.updateOne(
        { _id: updateCategoryDto._id },
        { name: updateCategoryDto.name,
          slug: slugify(updateCategoryDto.name)
         },
      );
    }


  remove(id: string) {
    return this.categoryModel.findByIdAndDelete(id).exec();
  }
}

 function slugify(input: string): string {
  return input
    .normalize('NFD')                       // tách dấu
    .replace(/[\u0300-\u036f]/g, '')        // xoá dấu tổ hợp
    .replace(/đ/g, 'd')                     // xử lý chữ đ
    .replace(/Đ/g, 'd')                     // xử lý chữ Đ
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')                   // space -> -
    .replace(/[^a-z0-9-]/g, '')             // loại ký tự đặc biệt
    .replace(/-+/g, '-');                   // gộp nhiều -
}



