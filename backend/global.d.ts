import { IUser } from './src/features/user/model'

declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser
  }
}
