import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const AuthController = () => import('#controllers/auth_controller')
const PasswordResetsController = () => import('#controllers/password_resets_controller')
const AccountController = () => import('#controllers/account_controller')
const AddressesController = () => import('#controllers/addresses_controller')
const PaymentMethodsController = () => import('#controllers/payment_methods_controller')
const ProductsController = () => import('#controllers/products_controller')
const CategoriesController = () => import('#controllers/categories_controller')
const ProductImagesController = () => import('#controllers/product_images_controller')
const SiteConfigController = () => import('#controllers/site_config_controller')

router.get('/', async () => ({ hello: 'world' }))

router.get('/site-config/homepage', [SiteConfigController, 'homepage'])

router
  .group(() => {
    router.post('register', [AuthController, 'register'])
    router.post('login', [AuthController, 'login'])
    router.post('verify-email', [AuthController, 'verifyEmail'])
    router.post('forgot-password', [PasswordResetsController, 'request'])
    router.post('reset-password', [PasswordResetsController, 'reset'])

    router
      .group(() => {
        router.post('refresh', [AuthController, 'refresh'])
        router.post('logout', [AuthController, 'logout'])
        router.get('me', [AuthController, 'me'])
        router.post('resend-verification', [AuthController, 'resendVerification'])
      })
      .use(middleware.auth())
  })
  .prefix('/auth')

router
  .group(() => {
    router.get('/', [AccountController, 'show'])
    router.patch('/', [AccountController, 'updateProfile'])
    router.post('email', [AccountController, 'changeEmail'])
    router.post('password', [AccountController, 'changePassword'])
    router.post('deactivate', [AccountController, 'deactivate'])

    router.get('addresses', [AddressesController, 'index'])
    router.post('addresses', [AddressesController, 'store'])
    router.patch('addresses/:id', [AddressesController, 'update'])
    router.delete('addresses/:id', [AddressesController, 'destroy'])

    router.get('payment-methods', [PaymentMethodsController, 'index'])
    router.post('payment-methods', [PaymentMethodsController, 'store'])
    router.patch('payment-methods/:id', [PaymentMethodsController, 'update'])
    router.delete('payment-methods/:id', [PaymentMethodsController, 'destroy'])
  })
  .prefix('/account')
  .use(middleware.auth())

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
