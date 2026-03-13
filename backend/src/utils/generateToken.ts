import jwt from 'jsonwebtoken'

export default function generateToken(userId: string) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: '30d',
    algorithm: 'HS512',
  })
}
