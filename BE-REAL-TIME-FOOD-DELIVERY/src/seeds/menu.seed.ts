import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MenuCategory } from '../entities/menu-category.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { MenuItemImage } from '../entities/menu-item-image.entity';

@Injectable()
export class MenuSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MenuSeedService.name);

  constructor(
    @InjectRepository(MenuCategory)
    private readonly categoryRepository: Repository<MenuCategory>,

    @InjectRepository(MenuItem)
    private readonly itemRepository: Repository<MenuItem>,

    @InjectRepository(MenuItemImage)
    private readonly itemImageRepository: Repository<MenuItemImage>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seed();
  }

  private async seed(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      this.logger.log('Skip menu seed in production.');
      return;
    }

    const categoryCount = await this.categoryRepository.count();
    const itemCount = await this.itemRepository.count();

    if (categoryCount > 0 || itemCount > 0) {
      this.logger.log('Menu seed skipped because data already exists.');
      return;
    }

    this.logger.log('Start seeding menu data...');

    const categoryPayloads = [
      {
        name: 'Pizza',
        description: 'Các món pizza bán trong ngày',
        sortOrder: 1,
        isActive: true,
      },
      {
        name: 'Hamberger',
        description: 'Các món hamberger bán trong ngày',
        sortOrder: 2,
        isActive: true,
      },
      {
        name: 'Gà Rán',
        description: 'Các món gà rán bán trong ngày',
        sortOrder: 3,
        isActive: true,
      },
      {
        name: 'Mì Ý',
        description: 'Các món mì ý bán trong ngày',
        sortOrder: 4,
        isActive: true,
      },
      {
        name: 'Cơm',
        description: 'Các món cơm bán trong ngày',
        sortOrder: 5,
        isActive: true,
      },
      {
        name: 'Món Phụ',
        description: 'Các món phụ bán trong ngày',
        sortOrder: 6,
        isActive: true,
      },
      {
        name: 'Nước Uống',
        description: 'Các món nước uống bán trong ngày',
        sortOrder: 7,
        isActive: true,
      },
      {
        name: 'Trà Sữa',
        description: 'Các món trà sữa bán trong ngày',
        sortOrder: 8,
        isActive: true,
      },
      {
        name: 'Tráng Miệng',
        description: 'Các món tráng miệng bán trong ngày',
        sortOrder: 9,
        isActive: true,
      },
      {
        name: 'Combo',
        description: 'Các combo bán trong ngày',
        sortOrder: 10,
        isActive: true,
      },
    ];

    const savedCategories = await this.categoryRepository.save(
      categoryPayloads.map((payload) => this.categoryRepository.create(payload)),
    );

    const categoryMap = new Map<string, MenuCategory>();
    for (const category of savedCategories) {
      categoryMap.set(category.name, category);
    }

    const itemPayloads: Array<{
      categoryName: string;
      name: string;
      description: string;
      price: number;
      isAvailable: boolean;
      isActive: boolean;
      sortOrder: number;
      images: Array<{
        imageUrl: string;
        isThumbnail: boolean;
        sortOrder: number;
      }>;
    }> = [
      {
        categoryName: 'Pizza',
        name: 'Pizza Hải Sản Cỡ Lớn',
        description: 'Pizza hải sản với phô mai mozzarella',
        price: 199000,
        isAvailable: true,
        isActive: true,
        sortOrder: 1,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-1a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-1b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
      {
        categoryName: 'Pizza',
        name: 'Pizza Pepperoni',
        description: 'Pizza pepperoni đậm vị kiểu Mỹ',
        price: 179000,
        isAvailable: true,
        isActive: true,
        sortOrder: 2,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-2a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-2b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
      {
        categoryName: 'Hamberger',
        name: 'Hamberger Cỡ Lớn',
        description: 'Hamberger với phô mai mozzarella',
        price: 200000,
        isAvailable: true,
        isActive: true,
        sortOrder: 1,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-3a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-3b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
      {
        categoryName: 'Hamberger',
        name: 'Hamberger Bò Phô Mai',
        description: 'Hamberger bò nướng kèm phô mai cheddar',
        price: 159000,
        isAvailable: true,
        isActive: true,
        sortOrder: 2,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-4a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-4b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
      {
        categoryName: 'Gà Rán',
        name: 'Gà Rán 2 Miếng',
        description: 'Gà rán giòn rụm ăn kèm tương ớt',
        price: 69000,
        isAvailable: true,
        isActive: true,
        sortOrder: 1,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-5a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-5b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
      {
        categoryName: 'Gà Rán',
        name: 'Gà Rán 4 Miếng',
        description: 'Gà rán phần lớn cho 2 người',
        price: 129000,
        isAvailable: true,
        isActive: true,
        sortOrder: 2,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-6a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-6b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
      {
        categoryName: 'Mì Ý',
        name: 'Mì Ý Bò Bằm',
        description: 'Mì ý sốt bò bằm truyền thống',
        price: 99000,
        isAvailable: true,
        isActive: true,
        sortOrder: 1,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-7a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-7b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
      {
        categoryName: 'Mì Ý',
        name: 'Mì Ý Kem Nấm',
        description: 'Mì ý sốt kem nấm béo ngậy',
        price: 109000,
        isAvailable: true,
        isActive: true,
        sortOrder: 2,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-8a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-8b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
      {
        categoryName: 'Cơm',
        name: 'Cơm Gà Sốt Teriyaki',
        description: 'Cơm gà áp chảo sốt teriyaki',
        price: 89000,
        isAvailable: true,
        isActive: true,
        sortOrder: 1,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-9a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-9b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
      {
        categoryName: 'Cơm',
        name: 'Cơm Bò Xào',
        description: 'Cơm bò xào rau củ đậm vị',
        price: 95000,
        isAvailable: true,
        isActive: true,
        sortOrder: 2,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-10a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-10b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
      {
        categoryName: 'Món Phụ',
        name: 'Khoai Tây Chiên',
        description: 'Khoai tây chiên giòn thơm ngon',
        price: 39000,
        isAvailable: true,
        isActive: true,
        sortOrder: 1,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-11a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-11b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
      {
        categoryName: 'Món Phụ',
        name: 'Xúc Xích Chiên',
        description: 'Xúc xích chiên ăn kèm tương cà',
        price: 49000,
        isAvailable: true,
        isActive: true,
        sortOrder: 2,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-12a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-12b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
      {
        categoryName: 'Nước Uống',
        name: 'Coca Cola',
        description: 'Nước ngọt coca cola lon',
        price: 18000,
        isAvailable: true,
        isActive: true,
        sortOrder: 1,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-13a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-13b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
      {
        categoryName: 'Nước Uống',
        name: 'Pepsi',
        description: 'Nước ngọt pepsi lon',
        price: 18000,
        isAvailable: true,
        isActive: true,
        sortOrder: 2,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-14a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-14b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
      {
        categoryName: 'Trà Sữa',
        name: 'Trà Sữa Trân Châu',
        description: 'Trà sữa truyền thống với trân châu đen',
        price: 45000,
        isAvailable: true,
        isActive: true,
        sortOrder: 1,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-15a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-15b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
      {
        categoryName: 'Trà Sữa',
        name: 'Trà Sữa Matcha',
        description: 'Trà sữa matcha thơm béo',
        price: 55000,
        isAvailable: true,
        isActive: true,
        sortOrder: 2,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-16a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-16b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
      {
        categoryName: 'Tráng Miệng',
        name: 'Bánh Tiramisu',
        description: 'Bánh tiramisu mềm mịn',
        price: 52000,
        isAvailable: true,
        isActive: true,
        sortOrder: 1,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-17a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-17b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
      {
        categoryName: 'Tráng Miệng',
        name: 'Pudding Caramel',
        description: 'Pudding caramel ngọt nhẹ',
        price: 32000,
        isAvailable: true,
        isActive: true,
        sortOrder: 2,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-18a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-18b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
      {
        categoryName: 'Combo',
        name: 'Combo Pizza + Nước',
        description: '1 pizza và 2 lon nước ngọt',
        price: 219000,
        isAvailable: true,
        isActive: true,
        sortOrder: 1,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-19a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-19b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
      {
        categoryName: 'Combo',
        name: 'Combo Hamberger + Khoai + Nước',
        description: '1 hamberger, 1 khoai tây và 1 nước',
        price: 159000,
        isAvailable: true,
        isActive: true,
        sortOrder: 2,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-20a/800/600',
            isThumbnail: true,
            sortOrder: 0,
          },
          {
            imageUrl: 'https://picsum.photos/seed/menu-item-20b/800/600',
            isThumbnail: false,
            sortOrder: 1,
          },
        ],
      },
    ];

    for (const payload of itemPayloads) {
      const category = categoryMap.get(payload.categoryName);

      if (!category) {
        this.logger.warn(`Category not found for item: ${payload.name}`);
        continue;
      }

      const createdItem = this.itemRepository.create({
        categoryId: category.id,
        name: payload.name,
        description: payload.description,
        price: payload.price,
        isAvailable: payload.isAvailable,
        isActive: payload.isActive,
        sortOrder: payload.sortOrder,
      });

      const savedItem = await this.itemRepository.save(createdItem);

      const itemImages = payload.images.map((image) =>
        this.itemImageRepository.create({
          menuItemId: savedItem.id,
          imageUrl: image.imageUrl,
          isThumbnail: image.isThumbnail,
          sortOrder: image.sortOrder,
        }),
      );

      await this.itemImageRepository.save(itemImages);
    }

    this.logger.log('Seeding menu completed: 10 categories and 20 items created.');
  }
}