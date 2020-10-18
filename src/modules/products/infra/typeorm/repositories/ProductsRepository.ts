import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';
import AppError from '@shared/errors/AppError';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity
    })
    await this.ormRepository.save(product)
    return product
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: { name }
    })
    return findProduct
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const idList = products.map(product => product.id)
    const orderList = await this.ormRepository.find({ id: In(idList) })
    if (idList.length !== orderList.length) {
      throw new AppError('Produto faltando.')
    }
    return orderList
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productData = await this.findAllById(products)
    const newProducts = productData.map(productData => {
      const productFind = products.find(product => product.id === productData.id)
      if (!productFind) {
        throw new AppError('Produto não encontrado.')
      }
      if (productData.quantity < productFind.quantity) {
        throw new AppError('Quantidade insuficiente de produto.')
      }
      const newProduct = productData
      newProduct.quantity -= productFind.quantity
      return newProduct
    })
    await this.ormRepository.save(newProducts)
    return newProducts
  }
}

export default ProductsRepository;
