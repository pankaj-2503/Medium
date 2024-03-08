import { Hono } from "hono"
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import {signupInput,signinInput,createBlogInput,updateBlogInput} from "@pankaj100xdev/medium-commonupdates"
import { decode, sign,verify} from 'hono/jwt'
export const userRouter = new Hono<{
    Bindings:{
       DATABASE_URL:string,
       JWT_SECRET:string,
    },
    Variables:{
        userId:string,
     }
}>();

userRouter.post('/signup',async(c)=>{

    const prisma = new PrismaClient({
      datasourceUrl:c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  
    const body=await c.req.json();
    const {success}=signupInput.safeParse(body);
    if(!success){
        c.status(403);
        return c.json({
            message:"Inputs are not correct"
        })
    }
    
    try{
      const user=await prisma.user.create({
        data:{
          email:body.email,
          password:body.password,
        },
      })
      const jwt=await sign({id:user.id},c.env.JWT_SECRET);
      return c.json({jwt});
  
    }catch(e){
      c.status(403);
      return c.json({message:"error while signing up"});
  
    }
   
  })
  
  userRouter.post('/signin',async(c)=>{
  
    const prisma = new PrismaClient({
      datasourceUrl:c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  
    const body=await c.req.json();
    const user=await prisma.user.findUnique({
      where:{
        email:body.email
      }
    })
    if(!user){
      c.status(403);
      return c.json({message:"user not found"})
    }
    const jwt=await sign({id:user.id},c.env.JWT_SECRET);
    return c.json({jwt});
   
  })