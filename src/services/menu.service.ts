import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateMenuCategoryDto } from 'src/dto/menu/create-menu-category.dto';
import {
  CreateMenuItemDto,
  CreateMenuItemImageDto,
} from 'src/dto/menu/create-menu-item.dto';
import { MenuItemResponseDto } from 'src/dto/menu/menu-item-response.dto';
import { MenuItemQueryDto } from 'src/dto/menu/menu-item-query.dto';
import { MenuQueryDto } from 'src/dto/menu/menu-query.dto';
import { UpdateMenuCategoryDto } from 'src/dto/menu/update-menu-category.dto';
import {
  UpdateMenuItemDto,
  UpdateMenuItemImageDto,
} from 'src/dto/menu/update-menu-item.dto';
import { MenuCategory } from 'src/entities/menu-category.entity';
import { MenuItemImage } from 'src/entities/menu-item-image.entity';
import { MenuItem } from 'src/entities/menu-item.entity';
import { MenuCategoryRepository } from 'src/repositories/menu-category.repository';
import { MenuItemRepository } from 'src/repositories/menu-item.repository';

@Injectable()
export class MenuService {
  constructor(
    private readonly menuCategoryRepository: MenuCategoryRepository,
    private readonly menuItemRepository: MenuItemRepository,

    @InjectRepository(MenuCategory)
    private readonly menuCategoryOrmRepository: Repository<MenuCategory>,

    @InjectRepository(MenuItem)
    private readonly menuItemOrmRepository: Repository<MenuItem>,

    @InjectRepository(MenuItemImage)
    private readonly menuItemImageOrmRepository: Repository<MenuItemImage>,
  ) {}

  async createCategory(
    createMenuCategoryDto: CreateMenuCategoryDto,
  ): Promise<MenuCategory> {
    const existingCategory = await this.menuCategoryRepository.findByName(
      createMenuCategoryDto.name.trim(),
    );

    if (existingCategory) {
      throw new BadRequestException('Menu category name already exists');
    }

    const menuCategory = new MenuCategory();
    menuCategory.name = createMenuCategoryDto.name.trim();
    menuCategory.description = createMenuCategoryDto.description?.trim();
    menuCategory.sortOrder = createMenuCategoryDto.sortOrder ?? 0;
    menuCategory.isActive = createMenuCategoryDto.isActive ?? true;

    return this.menuCategoryRepository.save(menuCategory);
  }

  async getStaffMenu() {
    const items = await this.menuItemRepository.findStaffMenu();
    return items.map((item) => this.toAdminMenuItemResponse(item));
  }

  async createMenuItem(
    createMenuItemDto: CreateMenuItemDto,
  ): Promise<MenuItem> {
    const category = await this.menuCategoryRepository.findById(
      createMenuItemDto.categoryId,
    );

    if (!category) {
      throw new NotFoundException('Menu category not found');
    }

    if (!category.isActive) {
      throw new BadRequestException(
        'Cannot create menu item in inactive category',
      );
    }

    const existingMenuItem = await this.menuItemRepository.findByName(
      createMenuItemDto.name.trim(),
    );

    if (existingMenuItem) {
      throw new BadRequestException('Menu item name already exists');
    }

    this.validateThumbnailImages(createMenuItemDto.images);

    const menuItem = new MenuItem();
    menuItem.categoryId = createMenuItemDto.categoryId;
    menuItem.name = createMenuItemDto.name.trim();
    menuItem.description = createMenuItemDto.description?.trim();
    menuItem.price = createMenuItemDto.price;
    menuItem.isAvailable = createMenuItemDto.isAvailable ?? true;
    menuItem.isActive = createMenuItemDto.isActive ?? true;
    menuItem.sortOrder = createMenuItemDto.sortOrder ?? 0;

    if (!menuItem.isActive) {
      menuItem.isAvailable = false;
    }

    if (createMenuItemDto.images?.length) {
      menuItem.images = this.buildMenuItemImages(
        menuItem,
        createMenuItemDto.images,
      );
    }

    return this.menuItemRepository.save(menuItem);
  }

  async updateAvailability(
    id: number,
    isAvailable: boolean,
  ): Promise<MenuItem> {
    const menuItem = await this.menuItemRepository.findById(id);

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    if (!menuItem.isActive) {
      throw new BadRequestException(
        'Inactive menu item cannot be toggled by staff',
      );
    }

    menuItem.isAvailable = isAvailable;
    return this.menuItemRepository.save(menuItem);
  }

  async getPublicMenu(queryDto: MenuQueryDto): Promise<MenuItemResponseDto[]> {
    const menuItems = await this.menuItemRepository.findPublicMenu(
      queryDto.category,
    );
    return menuItems.map((menuItem) => this.toPublicResponse(menuItem));
  }

  async getPublicMenuItemDetail(id: number): Promise<MenuItemResponseDto> {
    const menuItem = await this.menuItemRepository.findPublicMenuItemById(id);

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    return this.toPublicResponse(menuItem);
  }

  async getAdminCategories() {
    const categories = await this.menuCategoryOrmRepository.find({
      relations: {
        menuItems: true,
      },
      order: {
        sortOrder: 'ASC',
        id: 'ASC',
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description ?? null,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      itemCount: category.menuItems?.length ?? 0,
      activeItemCount:
        category.menuItems?.filter((item) => item.isActive).length ?? 0,
    }));
  }

  async updateCategory(id: number, dto: UpdateMenuCategoryDto) {
    const category = await this.menuCategoryOrmRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Menu category not found');
    }

    if (dto.name !== undefined) {
      const normalizedName = dto.name.trim();
      const duplicated = await this.menuCategoryOrmRepository
        .createQueryBuilder('category')
        .where('LOWER(category.name) = LOWER(:name)', { name: normalizedName })
        .andWhere('category.id != :id', { id })
        .getOne();

      if (duplicated) {
        throw new BadRequestException('Menu category name already exists');
      }

      category.name = normalizedName;
    }

    if (dto.description !== undefined) {
      const trimmedDescription = dto.description.trim();
      category.description =
        trimmedDescription.length > 0 ? trimmedDescription : undefined;
    }
    if (dto.sortOrder !== undefined) {
      category.sortOrder = dto.sortOrder;
    }

    if (dto.isActive !== undefined) {
      category.isActive = dto.isActive;

      if (!dto.isActive) {
        await this.menuItemOrmRepository
          .createQueryBuilder()
          .update(MenuItem)
          .set({
            isActive: false,
            isAvailable: false,
          })
          .where('category_id = :categoryId', { categoryId: id })
          .execute();
      }
    }

    const savedCategory = await this.menuCategoryOrmRepository.save(category);

    return {
      id: savedCategory.id,
      name: savedCategory.name,
      description: savedCategory.description ?? null,
      sortOrder: savedCategory.sortOrder,
      isActive: savedCategory.isActive,
    };
  }

  async deleteCategory(id: number) {
    const category = await this.menuCategoryOrmRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Menu category not found');
    }

    category.isActive = false;
    await this.menuCategoryOrmRepository.save(category);

    await this.menuItemOrmRepository
      .createQueryBuilder()
      .update(MenuItem)
      .set({
        isActive: false,
        isAvailable: false,
      })
      .where('category_id = :categoryId', { categoryId: id })
      .execute();

    return {
      message: 'Menu category deleted successfully (soft delete)',
      categoryId: id,
    };
  }

  async getAdminMenuItems(queryDto: MenuItemQueryDto) {
    const queryBuilder = this.menuItemOrmRepository
      .createQueryBuilder('menuItem')
      .leftJoinAndSelect('menuItem.category', 'category')
      .leftJoinAndSelect('menuItem.images', 'images');

    if (queryDto.categoryId) {
      queryBuilder.andWhere('menuItem.categoryId = :categoryId', {
        categoryId: queryDto.categoryId,
      });
    }

    if (queryDto.keyword?.trim()) {
      const keyword = `%${queryDto.keyword.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        "(LOWER(menuItem.name) LIKE :keyword OR LOWER(COALESCE(menuItem.description, '')) LIKE :keyword)",
        { keyword },
      );
    }

    queryBuilder.orderBy('menuItem.sortOrder', 'ASC');
    queryBuilder.addOrderBy('menuItem.id', 'ASC');
    queryBuilder.addOrderBy('images.sortOrder', 'ASC');
    queryBuilder.addOrderBy('images.id', 'ASC');

    const items = await queryBuilder.getMany();
    return items.map((item) => this.toAdminMenuItemResponse(item));
  }

  async getAdminMenuItemDetail(id: number) {
    const menuItem = await this.menuItemRepository.findById(id);

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    return this.toAdminMenuItemResponse(menuItem);
  }

  async updateMenuItem(id: number, dto: UpdateMenuItemDto) {
    const menuItem = await this.menuItemRepository.findById(id);

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    let targetCategory = menuItem.category;

    if (
      dto.categoryId !== undefined &&
      dto.categoryId !== menuItem.categoryId
    ) {
      const category = await this.menuCategoryRepository.findById(
        dto.categoryId,
      );

      if (!category) {
        throw new NotFoundException('Menu category not found');
      }

      targetCategory = category;
      menuItem.categoryId = dto.categoryId;
    }

    if (dto.name !== undefined) {
      const normalizedName = dto.name.trim();
      const duplicated = await this.menuItemOrmRepository
        .createQueryBuilder('menuItem')
        .where('LOWER(menuItem.name) = LOWER(:name)', { name: normalizedName })
        .andWhere('menuItem.id != :id', { id })
        .getOne();

      if (duplicated) {
        throw new BadRequestException('Menu item name already exists');
      }

      menuItem.name = normalizedName;
    }

    if (dto.description !== undefined) {
      const trimmedDescription = dto.description.trim();
      menuItem.description =
        trimmedDescription.length > 0 ? trimmedDescription : undefined;
    }

    if (dto.price !== undefined) {
      menuItem.price = dto.price;
    }

    if (dto.sortOrder !== undefined) {
      menuItem.sortOrder = dto.sortOrder;
    }

    if (dto.isActive !== undefined) {
      menuItem.isActive = dto.isActive;
    }

    if (dto.isAvailable !== undefined) {
      menuItem.isAvailable = dto.isAvailable;
    }

    if (!menuItem.isActive) {
      menuItem.isAvailable = false;
    }

    if (targetCategory && !targetCategory.isActive && menuItem.isActive) {
      throw new BadRequestException(
        'Cannot activate menu item inside inactive category',
      );
    }

    if (dto.images !== undefined) {
      this.validateThumbnailImages(dto.images);

      await this.menuItemImageOrmRepository.delete({ menuItemId: id });
      menuItem.images = this.buildMenuItemImages(menuItem, dto.images, id);
    }

    const saved = await this.menuItemRepository.save(menuItem);
    return this.getAdminMenuItemDetail(saved.id);
  }

  async deleteMenuItem(id: number) {
    const menuItem = await this.menuItemRepository.findById(id);

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    menuItem.isActive = false;
    menuItem.isAvailable = false;

    await this.menuItemRepository.save(menuItem);

    return {
      message: 'Menu item deleted successfully (soft delete)',
      menuItemId: id,
    };
  }

  private buildMenuItemImages(
    menuItem: MenuItem,
    images: Array<CreateMenuItemImageDto | UpdateMenuItemImageDto>,
    forcedMenuItemId?: number,
  ): MenuItemImage[] {
    return images.map((imageDto) => {
      const image = new MenuItemImage();
      image.menuItem = menuItem;
      if (forcedMenuItemId) {
        image.menuItemId = forcedMenuItemId;
      }
      image.imageUrl = imageDto.imageUrl!;
      image.isThumbnail = imageDto.isThumbnail ?? false;
      image.sortOrder = imageDto.sortOrder ?? 0;
      return image;
    });
  }

  private validateThumbnailImages(
    images?: Array<CreateMenuItemImageDto | UpdateMenuItemImageDto>,
  ) {
    if (!images?.length) return;

    const thumbnailCount = images.filter(
      (image) => image.isThumbnail === true,
    ).length;

    if (thumbnailCount > 1) {
      throw new BadRequestException('Only one thumbnail image is allowed');
    }
  }

  private toPublicResponse(menuItem: MenuItem): MenuItemResponseDto {
    const thumbnailImage =
      menuItem.images?.find((image) => image.isThumbnail) ??
      menuItem.images?.[0] ??
      null;

    return {
      id: menuItem.id,
      name: menuItem.name,
      description: menuItem.description ?? null,
      price: menuItem.price,
      imageUrl: thumbnailImage?.imageUrl ?? null,
      category: menuItem.category?.name ?? '',
      available: menuItem.isAvailable,
    };
  }

  private toAdminMenuItemResponse(menuItem: MenuItem) {
    return {
      id: menuItem.id,
      categoryId: menuItem.categoryId,
      categoryName: menuItem.category?.name ?? null,
      name: menuItem.name,
      description: menuItem.description ?? null,
      price: menuItem.price,
      isAvailable: menuItem.isAvailable,
      isActive: menuItem.isActive,
      sortOrder: menuItem.sortOrder,
      images:
        menuItem.images?.map((image) => ({
          id: image.id,
          imageUrl: image.imageUrl,
          isThumbnail: image.isThumbnail,
          sortOrder: image.sortOrder,
        })) ?? [],
    };
  }
}
