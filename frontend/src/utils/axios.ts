import axios from 'axios'

const baseURL =
  process.env.NEXT_PUBLIC_NODE_ENV === 'development'
    ? 'http://localhost:8080'
    : process.env.NEXT_PUBLIC_API_URL

const instance = axios.create({ baseURL })

export default instance
