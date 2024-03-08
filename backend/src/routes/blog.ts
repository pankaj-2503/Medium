import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { Hono } from "hono";
import { verify } from "hono/jwt";

export const blogRouter=new Hono<{
    Bindings:{
        DATABASE_URL:string,
        JWT_SECRET:string,
     },
     Variables:{
        userId:string,
     }
}>();

//middleware
blogRouter.use('/*',async(c,next)=>{
    const jwt= c.req.header('Authorization') || "";
    
    if(!jwt){
        c.status(401);
        return c.json({error:"unauthorized"});
    }
    const token=jwt.split(' ')[1];
    const payload=await verify(token,c.env.JWT_SECRET);
    if(!payload){
        c.status(401);
        return c.json({error:"unauthorized"});
    }
    c.set('userId',payload.id);
    await next();
})

//to post blog
blogRouter.post('/',async(c)=>{
    const body=await c.req.json();
    const authorId=c.get("userId");
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    

    const blog=await prisma.post.create({
         data: {
            title: body.title,
            content: body.content,
            authorId: authorId,
         },
    })
    return c.json({
        id:blog.id
    })
 })
 
//to update blog
blogRouter.put('/',async(c)=>{
    const body=await c.req.json();
   
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    

    const blog=await prisma.post.update({
        where:{
            id:body.id,
        },
         data: {
            title: body.title,
            content: body.content,
            
         }
    })
    return c.json({
        id:blog.id
    })
 })

  //add pagination
 //to get all blogs by user
blogRouter.get('/bulk',async(c)=>{
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const blogs=await prisma.post.findMany();
    return c.json({
        blogs
    })
 })


//get blogs 
blogRouter.get('/:id',async(c)=>{
    const id=await c.req.param("id");
   
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    
    //it could fail due multiple reasons like post might not be present
    try{
        const blog=await prisma.post.findFirst({
            where:{
               id:id,
            }
       })
       return c.json({
        blog
    });

    }catch(e){
       c.status(411);
       return c.json({message:"Error while fetching blog"});
    }
    
    
 })


