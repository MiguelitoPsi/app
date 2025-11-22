import { auth } from './lib/auth'

console.log(Object.keys(auth))
console.log(Object.keys(auth.api || {}))
