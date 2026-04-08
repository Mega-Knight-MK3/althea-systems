import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const AuthController = () => import('#controllers/auth_controller')
const ProductsController = () => import('#controllers/products_controller')
const CategoriesController = () => import('#controllers/categories_controller')
const ProductImagesController = () => import('#controllers/product_images_controller')

router.get('/', async () => ({ hello: 'world' }))

router
  .group(() => {
    router.post('register', [AuthController, 'register'])
    router.post('login', [AuthController, 'login'])

    router
      .group(() => {
        router.post('refresh', [AuthController, 'refresh'])
        router.post('logout', [AuthController, 'logout'])
        router.get('me', [AuthController, 'me'])
      })
      .use(middleware.auth())
  })
  .prefix('/auth')

router
  .group(() => {
    router.get('/', [CategoriesController, 'index'])
    router.get(':slug', [CategoriesController, 'show'])
  })
  .prefix('/categories')

router
  .group(() => {
    router.post('/', [CategoriesController, 'store'])
    router.patch(':id', [CategoriesController, 'update'])
    router.delete(':id', [CategoriesController, 'destroy'])
  })
  .prefix('/admin/categories')
  .use([middleware.auth(), middleware.admin()])

router
  .group(() => {
    router.get('/', [ProductsController, 'index'])
    router.get(':slug', [ProductsController, 'show'])
    router.get(':slug/similar', [ProductsController, 'similar'])
    router.get(':slug/images', [ProductImagesController, 'index'])
  })
  .prefix('/products')

router.get('/images/:id', [ProductImagesController, 'show'])

router
  .group(() => {
    router.post('/', [ProductsController, 'store'])
    router.patch(':id', [ProductsController, 'update'])
    router.delete(':id', [ProductsController, 'destroy'])
    router.post(':slug/images', [ProductImagesController, 'store'])
    router.delete('images/:id', [ProductImagesController, 'destroy'])
  })
  .prefix('/admin/products')
  .use([middleware.auth(), middleware.admin()])
