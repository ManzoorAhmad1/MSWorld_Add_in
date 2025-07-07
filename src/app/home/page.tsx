import React from 'react'
import dynamic from 'next/dynamic'
const Home = dynamic(() => import('../../components/home'), { ssr: false })
const page = () => {
  return (
    <div>
      <Home/>
    </div>
  )
}

export default page
