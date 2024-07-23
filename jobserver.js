require('dotenv').config()
const express=require('express')  //create server by express
const app=express()
const port=process.env.PORT || 3000;
const cors=require('cors')
const bcrypt=require('bcrypt')
const {MongoClient,ObjectID, ServerApiVersion}=require('mongodb');
const multer = require('multer')
const fs = require("fs")
const path = require('path')
const jwt = require('jsonwebtoken')
const jwt_secret = process.env.jwt_secret;


const storage = multer.diskStorage({

    destination:function(req,file,cb){

      const memberid = req.params.memberid
      const dir = path.join(__dirname,'memberimage',memberid)

      console.log(dir);
      
      fs.exists(dir,exist=>{
        if (!exist){
           fs.mkir(dir,{reursive:true},error=>cb(error,dir));
        }
      })

      cb(null,dir)

    },filename:function(req,file,cb){
     console.log(file)
      cb(null,file.originalname)

    }

});



const companystorage = multer.diskStorage({

  destination:function(req,file,cb){

    const companyid = req.params.companyid
    const dir = path.join(__dirname,'companyimage',companyid)

    console.log(dir);
    
    fs.exists(dir,exist=>{
      if (!exist){
         fs.mkir(dir,{reursive:true},error=>cb(error,dir));
      }
    })

    cb(null,dir)

  },filename:function(req,file,cb){
   console.log(file)
    cb(null,file.originalname)

  }

});




app.use(cors());

const bodyParser=require('body-parser');
const { error } = require('console');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))

const uri = "mongodb+srv://doughnuttammaimeeroo:6XBxQcEdzwkk2rDY@cluster0.vvphc6b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
  }
  run().catch(console.dir);


  //call function setting storage
  const upload = multer({
    storage: storage
});

const companyupload = multer({
  storage: companystorage
});




app.get('/jobmatching/:memberid',async (req,res)=>{

try {
  

  await client.connect();
  const db=  client.db('jobseeker')
  const collection =db.collection('memberskill')

  const job_collection =db.collection('jobs')
  var json= []

  //console.log(req.params.email)

  const filter={memberid:req.params.memberid};
  const data_skill = collection.find(filter);
  var count_skill=await data_skill.count()
  var i_skill= 0;
  console.log("skill"+count_skill);


  var render_count=0;

     let isRender= false
    
       data_skill.forEach(  document=>{

        i_skill++;

      
        //find skill in job
        //jobdesc
           let regex=new RegExp(document.skill,'i')
        //console.log(req.params.email)
            console.log(document.skill)

            var  filter_skill = {$or:[{position:regex},{jobdes:regex}]}
    
            const data_job = job_collection.find(filter_skill);
            //const count_job=  data_job.estimatedDocumentCount({})
    // console.log(data);
            var i_job=0;
            data_job.forEach(async document=>{

              i_job++;
    
          // console.log("serch",document.companyid)
              let companyname="-";

              const company =await db.collection('companies')
              const searchCompany =await company.findOne({companyid:document.companyid})
            
              if (searchCompany){
              //console.log(searchCompany.companyname);
                  companyname = searchCompany.companyname
              }

              console.log("search company 171",companyname)

              console.log("push"+document.jobdes)
               json.push({
                
                jobid:document._id,
                companyname:companyname,
                companyid:document.companyid,
                position:document.position,
                salary:document.salary,
                jobtype:document.jobtype,
                jobdes:document.jobdes,
                  
                })
   
                  
         

          })// line 123

     
          
    
        //   if (i_skill>=count_skill && render_count==0 && json.length>0){

            
        //     res.json(json)
        //     console.log("final json "+i_skill)
        //     console.log(json)
        //     isRender=true;
        //     render_count++;
        //     return true;
          
        // }
   


})


console.log(json)
    //res.json(json)
 
    // console.log("not found")
    // res.json(json)

  // setTimeout(() => {
  //   res.json(json)
  // }, 3000);

  var count_time=1;
  myInterval=setInterval(function(){

    if (json.length>0){
      clearInterval(myInterval)
      res.json(json)
     
    }

    count_time++;
    if (count_time>4){
      clearInterval(myInterval);
      res.json(json)
   
    }

  },1000);
}
catch(err){

  res.send(err)
}



  })





  





app.get('/getskill/:memberid',async(req,res)=>{
  try{

  await client.connect();
  const db= await client.db('jobseeker')
  const collection =db.collection('memberskill')
  var json=[]

  //console.log(req.params.email)

  const filter={memberid:req.params.memberid};

  const data =await collection.find(filter);


  await data.forEach(document=>{

    json.push({
    memberid:document.memberid,
    skill:document.skill
      
    })

  })

  res.json(json);

  }
  catch(err){
    res.send(err)

  }


})

app.get('/line/callback',async(req,res)=>{
  var json=[];
  res.json(json)
})

app.get('/line/register',async(req,res)=>{
  var json=[];
  res.json(json)
})

app.post('/addskill',async(req,res)=>{



let{memberid,skill} = req.body
console.log("skill+",skill)
await client.connect();
//1.connect db
const db=await client.db('jobseeker')
//2.connect collection
const collection=db.collection('memberskill')
const filter={memberid:memberid,skill:skill};

const cursor = await collection.findOne(filter)

console.log("find edit",cursor)

if(!cursor)
{
  const addskill={memberid:memberid,skill:skill}
  const result=await collection.insertOne(addskill)


  res.json({

    
    modifiedCount:0,
    acknowledge:result.acknowledged
})

}
else
{
  const skillupdate={skill:skill}
  const result=await collection.updateOne(filter,{$set:skillupdate})
  res.json({

    acknowledge:result.acknowledged,
    modifiedCount:result.modifiedCount

  })

}



})



app.put('/editprofile',async(req,res)=>{

  let {fullname,phoneno,memberid} = req.body
console.log("edit profile",req.body)
  await client.connect();
    //1.connect db
    const db=await client.db('jobseeker')
    //2.connect collection
    const collection=db.collection('members')
    const filter={memberid:memberid};
    console.log("edit member",memberid)
  
    const cursor = await collection.findOne(filter)
   
    console.log("find edit",cursor)
    
    if(!cursor)
    {
      res.json({

        valid:false,
        modifiedCount:0
    })

    }
    else
    {
      const profile_update={fullname,phoneno}
      const result=await collection.updateOne(filter,{$set:profile_update})
      res.json({
        valid:true,
        modifiedCount:result.modifiedCount

      })

    }

    

})




app.post('/login',async(req,res)=>{

let {email,password} = req.body
let isValid = false

await client.connect();
    const db= await client.db('jobseeker')
    const collection =db.collection('members')
    const filter = {email:email}  
    const cursor = await collection.findOne(filter)

    if(cursor)
    {
            //password
           isValid =  await  bcrypt.compare(password,cursor.password)
           
            console.log(isValid)
            res.json(
                {
                    memberid: cursor.memberid,   // test this line
                    status: isValid,
                    exist: true,
            
    
                }
            )



    }
    else{

        res.json(
            {
                memberid:'0',
                status: false,
                exist: false,
            
               

            }
        )
    }

})


/*
app.get('/companies',async(req,res)=>{

  await client.connect();
  const db=await client.db('jobseeker')
  const collection=db.collection('companies')
  const cursor=collection.find();

  let json=[];

  await cursor.forEach(document=>{

    json.push({
    
     email:document.email,
     companyid:document.companyid,
     companyname:document.companyname,
     address:document.address,
      
    })

  })

  res.json(json);






})

*/


app.post('/loginjwt',async(req,res)=>{

  let {email,password} = req.body
  let isValid = false
  
  await client.connect();
      const db= await client.db('jobseeker')
      const collection =db.collection('members')
      const filter = {email:email}  
      const cursor = await collection.findOne(filter)
  
      if(cursor)
      {
              //password
             isValid =  await  bcrypt.compare(password,cursor.password)
             
              console.log(isValid)

              jwt.sign({memberid:cursor.email},jwt_secret,{expiresIn:60},(err,token)=>{
                if (err){
                            
                    res.json(
                      {
                          memberid:'0',
                          status: false,
                          exist: false,
                          token:null,
                          message: "Unauthorize",
                      
                      }
                  )
                }else {
                  res.json(
                    {
                        memberid: cursor.memberid,   // test this line
                        status: true,
                        exist: true,
                        token:token,
                        message: "",
        
                    }
                )
    
                }


              })


         
  
  
      }
      else{
  
          res.json(
              {
                  memberid:'0',
                  status: false,
                  exist: false,
                  token:null,
                message: "Username or password incorrect",
                 
  
              }
          )
      }
  
  })

  function authenticateToken(req,res,next){

    const token = req.headers["authorization"]
    console.log(token);
    if(token==null)
      {
        return res.status(401).json({error:"unauthorize"})
      }
      //const options={
      //  ignoreExpiration:true
      //}

      jwt.verify(token,jwt_secret,(err,user)=>{

        if(err){

          return res.status(403).json({error:err.message})
        }

        req.user = user
        next();

      })






  }

  app.get('/testaccess',(req,res)=>{


    var token_me;
    jwt.sign({memberid:"donut"},jwt_secret,{expiresIn:'1h'},(err,token)=>{
      if (err){
       
        res.send("error")
      }else {
      

        var check_token=token;
        console.log("token",check_token);
          jwt.verify(check_token,jwt_secret,(err,user)=>{
    
            if(err){
    
             
               res.status(403).json({error:err.message})
            }
    
            res.json({success:token})
          })
    
    
    
    
      }
    })


  })


app.post('/loginCompany',async(req,res)=>{

  let {email,password} = req.body
  let isValid = false
  
  await client.connect();
      const db= await client.db('jobseeker')
      const collection =db.collection('companies')
      const filter = {email:email}  
      const cursor = await collection.findOne(filter)
  
      if(cursor)
      {
              //password
             isValid =  await  bcrypt.compare(password,cursor.password)
             
              console.log(isValid)
              res.json(
                  {
                      companyid: cursor.companyid,   // test this line
                      status: isValid,
                      exist: true,
              
      
                  }
              )
  
  
  
      }
      else{
  
          res.json(
              {
                  companyid:'',
                  status: false,
                  exist: false,
              
                 
  
              }
          )
      }
  
  })
  
  
  
  app.get('/companies',async(req,res)=>{
  
    await client.connect();
    const db=await client.db('jobseeker')
    const collection=db.collection('companies')
    const cursor=collection.find();
  
    let json=[];
  
    await cursor.forEach(document=>{
  
      json.push({
      
       email:document.email,
       companyid:document.companyid,
       companyname:document.companyname,
       address:document.address,
        
      })
  
    })
  
    res.json(json);
  
  
  })


  app.get('/getcompany/:companyid',async(req,res)=>{

    try {
  
      await client.connect();
      const db= await client.db('jobseeker')
      const collection =db.collection('companies')
     
  
      
     // const filter = {email:req.params.email}
      const filter={companyid:req.params.companyid};
      const cursor = await collection.findOne(filter)
      console.log(cursor)
     
  
      res.json(
  
          {
              
              companyid:cursor.companyid,
              companyname:cursor.companyname,
              phoneno:cursor.phoneno,
              about:cursor.about,
              address:cursor.address,
              benefit:cursor.benefit
              //image:cursor.image,
          }
  
      );
    }
    //Exception MongoExceoption 
    catch(error){
  
      res.json(
  
        {
            error:"Error to load data",
            companyid:'',
            companyname:'',
            phoneno:'',
        }
   ) }
  
  })

  app.put('/editcompany',async(req,res)=>{

    let {companyname,phoneno,companyid,about,address,benefit} = req.body
  //console.log("edit profile",req.body)
    await client.connect();
      //1.connect db
      const db=await client.db('jobseeker')
      //2.connect collection
      const collection=db.collection('companies')
      const filter={companyid:companyid};
      //console.log("edit member",memberid)
    
      const cursor = await collection.findOne(filter)
     
      console.log("find edit",cursor)
      
      if(!cursor)
      {
        res.json({
  
          valid:false,
          modifiedCount:0
      })
  
      }
      else
      {
        const profile_update={companyname:companyname,phoneno:phoneno,about:about,address:address,benefit:benefit}
        const result=await collection.updateOne(filter,{$set:profile_update})
        res.json({
          valid:true,
          modifiedCount:result.modifiedCount
  
        })
  
      }
  
      
  
  })

app.get('/getpositiongroup',async(req,res)=>{

 
  var fs=require('fs')

var group=JSON.parse(fs.readFileSync('positiongroups.json','utf-8'));
res.json(group);
/*
fs.readFile('positiongroups.json','utf-8',function(err,data){
if (err) throw err;
  group=JSON.parse(data); 
  console.log(group)
  res.json(group)
})

  
*/




})

app.get('/getprovince',async(req,res)=>{

  var fs=require('fs')

  var province=JSON.parse(fs.readFileSync('jobprovinces.json','utf-8'));
  res.json(province);


  


  
})



app.post('/registerCompany',async(req,res)=>{

  let {email,password} = req.body
  await client.connect();
  const db= await client.db('jobseeker')
  const collection =db.collection('companies')
  //validate email exists
  const filter = {email:email}
  const cursor = await collection.findOne(filter)
  if (!cursor){

  const hashpassword = await bcrypt.hash(password,10)
  
 
  const companyupdate={email:email,password:hashpassword}
  const result =await collection.insertOne(companyupdate)
 //insert cmmplte
  

  const filter_update = {email:email}
  const cursor_update = await collection.findOne(filter_update)
  const company_update={companyid:result.insertedId.toString()}
  const result_update=await collection.updateOne(filter,{$set:company_update})
  //set memberid


  var fs = require('fs');
  var dir = './companyimage/'+result.insertedId.toString();

  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
  }

  res.json({
    companyid :result.insertedId.toString(),
    status: result.acknowledged
    })
  }else{
      res.json({
          companyid :"0",
          status: false,
          valid: "duplicate"
      })
  }





})



//com id position

app.get('/getjobdetail/:companyid/:position',async(req,res)=>{

  await client.connect();
  const db= await client.db('jobseeker')
  const collection =db.collection('jobs')
  
  var json=[]

  //console.log(req.params.email)

  const filter={companyid:req.params.companyid,position:req.params.position};

  const searchjob =await collection.findOne(filter);


  if(searchjob){
    res.json({
     jobtype:searchjob.jobtype,
     salary:searchjob.salary,
     jobdes:searchjob.jobdes,
     companyid:searchjob.companyid,
     position:searchjob.position,
     province:searchjob.province,
     positiongroup:searchjob.positiongroup,
     jobqualification:searchjob.jobqualification,


     //companyname:document.companyname,
     jobid:searchjob._id.toString()}
    )
      
  } 
  else{
    res.json({});
  }

  
   
    
     
    

  })

  //console.log(json)

 
 






app.get('/educations',async(req,res)=>{
  await client.connect();
  const db=await client.db('jobseeker')
  const collection=db.collection('educations')
  const cursor=collection.find();

  let json=[];

  await cursor.forEach(document=>{

    json.push({
    
     email:document.email,
     university:document.university,
     major:document.major,
     gpa:document.gpa,
      
    })

  })

  res.json(json);



});



app.get('/geteducation/:memberid',async(req,res)=>{

  await client.connect();
  const db= await client.db('jobseeker')
  const collection =db.collection('educations')
  var json=[]

  //console.log(req.params.email)

  const filter={memberid:req.params.memberid};

  const data =await collection.find(filter);


  await data.forEach(document=>{

    json.push({
    
     email:document.email,
     university:document.university,
     major:document.major,
     gpa:document.gpa,
      
    })

  })

  res.json(json);




})

app.get('/getjoball/',async(req,res)=>{

  await client.connect();
  const db= await client.db('jobseeker')
  const collection =db.collection('jobs')
  let json=await []

  //console.log(req.params.email)

  //const filter={companyid:req.params.companyid};

  const data =await collection.find();
  
  var lastcompanyid="";
  var  i=0;
  var count=await data.count();
  console.log("count",count);
  if (count>0){
  await data.forEach(async document=>{
   
    console.log("serch",document.companyid)
    let companyname="-";

    const company = db.collection('companies')
    const searchCompany =await company.findOne({companyid:document.companyid})
    
    if (searchCompany){
      //console.log(searchCompany.companyname);
      companyname = searchCompany.companyname
      i++;
    }
 
    console.log("push")
    await json.push({
    
     jobid:document._id,
     companyname:companyname,
     companyid:document.companyid,
     position:document.position,
     positiongroup:document.positiongroup,
     province:document.province,
     salary:document.salary,
     jobtype:document.jobtype,
     jobdes:document.jobdes,
      
    })
    console.log(json)
    if(i>=count){
      console.log(json.length)
      res.json(json);
      return true;
      
    }

  })
  }
  else {
    res.send(json)
  }


 



})

app.get('/getlog',async(req,res)=>{
  await client.connect();
  const db= await client.db('jobseeker')
  const collection =db.collection('applog')

  var json=[]

  //console.log(req.params.email)

  
  const searchlog =await collection.find()


  await searchlog.forEach(document=>{

    json.push({
    
     createby:document.createby,
     remark:document.remark,
     log_date:document.log_date,
     logtype:document.logtype,
     ipaddress:document.ipaddress

      
    })

  })

  res.json(json);





})


app.get('/searchjob/:keyword/:positiongroup/:province',async(req,res)=>{

  await client.connect();
  const db= await client.db('jobseeker')
  const collection =db.collection('jobs')
  let json=await []
  let keyword =''
  if (req.params.keyword!="-"){
    keyword=req.params.keyword;
  }

  const logcollection = db.collection('applog')
  const applog={createby:"",log_date:new Date(),remark:`keyword = ${req.params.keyword} province= ${req.params.province} prositiongroup=${req.params.positiongroup}`,logtype:"search",ipaddress:""}
  const logresult = await logcollection.insertOne(applog)


  let regex=new RegExp(keyword,'i')
  //console.log(req.params.email)

  //const filter={companyid:req.params.companyid};
  var  filter = {$or:[{position:regex},{jobdes:regex}]}
  if (parseInt(req.params.positiongroup)>0){
    console.log("search group")
    filter = {$or:[{position:regex},{jobdes:regex}],positiongroup:req.params.positiongroup}
    if (parseInt(req.params.province)>0){
      
      console.log("search province after")
      filter = {$or:[{position:regex},{jobdes:regex}],
        positiongroup:req.params.positiongroup,
        province:req.params.province}
    }
  }
  else if (parseInt(req.params.province)>0){
    console.log("search province")
    filter = {$or:[{position:regex},{jobdes:regex}],province:req.params.province}
    if (parseInt(req.params.positiongroup)>0){
      console.log("search group after")
      filter = {$or:[{position:regex},{jobdes:regex}],
        positiongroup:req.params.positiongroup,
        province:req.params.province}
    }
  }
  const data =await collection.find(filter);
    console.log(data);
  
    var  i=0;
    var count=await data.count();
    console.log("count",count);
       if (count>0){
           await data.forEach(async document=>{
      
            console.log("serch",document.companyid)
            let companyname="-";

            const company = db.collection('companies')
            const searchCompany =await company.findOne({companyid:document.companyid})
          
            if (searchCompany){
            //console.log(searchCompany.companyname);
                companyname = searchCompany.companyname
                i++;
            }
 
      console.log("push")
      await json.push({
    
     jobid:document._id,
     companyname:companyname,
     companyid:document.companyid,
     position:document.position,
     salary:document.salary,
     jobtype:document.jobtype,
     jobdes:document.jobdes,
      
    })
     // console.log(json)
      if(i>=count){
        console.log(json.length)
        res.json(json);
        return true;
        
      }

  })
  }
  else {
    console.log("not found")
    res.send(json)
  }


 



})






app.get('/getjob/:companyid',async(req,res)=>{

  await client.connect();
  const db= await client.db('jobseeker')
  const collection =db.collection('jobs')
  var json=[]

  //console.log(req.params.email)

  const filter={companyid:req.params.companyid};

  const data =await collection.find(filter);


  await data.forEach(document=>{

    json.push({
    
     jobid:document._id,
     companyid:document.companyid,
     position:document.position,
     salary:document.salary,
     jobtype:document.jobtype,
     jobdes:document.jobdes,
     positiongroup:document.positiongroup,
     province:document.province,
     jobqualification:document.jobqualification,
      
    })

  })

  res.json(json);




})


app.get('/showhistory',async(req,res)=>{
  await client.connect();
  const db=await client.db('jobseeker')
  const collection=db.collection('jobshistory')
  const cursor=collection.find();

  let json=[];

  await cursor.forEach(document=>{

    json.push({
    
      memberid:document.memberid,
      companyname:document.companyname,
      position:document.position,
      salary:document.salary,
            //email:loginemail,
      jobtype:document.jobtype,
      jobdes:document.jobdes,
      createon:document.createon,
      applystatus:document.applystatus,
      jobid:document.jobid,
      jobhistoryid:document.jobhistoryid
      
      
    })

  })

  res.json(json);



});

app.get('/getapplyjobBycompany/:companyname',async(req,res)=>{

  await client.connect();
  const db= await client.db('jobseeker')
  const collection =db.collection('jobshistory')
  var json=[]

  //console.log(req.params.email)

  const filter={companyname:req.params.companyname};

  const data =await collection.find(filter);


  await data.forEach(document=>{


    const createon_utc=document.createon;

    var createon="";

    if (createon_utc){
      createon=createon_utc.toString()
    }

    json.push({
    
      memberid:document.memberid,
      position:document.position,
      createon:createon,
      jobhistoryid:document.jobhistoryid
      
    })

  })

  res.json(json);




})







app.get('/getapplyjob/:memberid',authenticateToken,async(req,res)=>{

  await client.connect();
  const db= await client.db('jobseeker')
  const collection =db.collection('jobshistory')
  var json=[]

  //console.log(req.params.email)

  const filter={memberid:req.params.memberid};

  const data =await collection.find(filter);


  await data.forEach(document=>{

    json.push({
    
      memberid:document.memberid,
      companyid:document.companyid,
      companyname:document.companyname,
      position:document.position,
      salary:document.salary,
            //email:loginemail,
      jobtype:document.jobtype,
      jobdes:document.jobdes,
      createon:document.createon,
      applystatus:document.applystatus,
      jobhistoryid:document.jobhistoryid
      
    })

  })

  res.json(json);



})



app.put('/updateStatus',async(req,res)=>{


  let {jobhistoryid,applystatus} = req.body
  console.log(req.body)
  console.log("jobhis",jobhistoryid);
  
  await client.connect();
    //1.connect db
    const db= await client.db('jobseeker')
    //2.connect collection
    const collection=db.collection('jobshistory')
    
  
   
    

    const filter_update = {jobhistoryid:jobhistoryid}
    
    const addjob={applystatus:applystatus,updateon:new Date()}
    const result=await collection.updateOne(filter_update,{$set:addjob})
    console.log(result);

    res.json(result)
       
  

})


app.delete('/deleteapplyjob',async (req,res)=>{

  let {jobhistoryid,applystatus} = req.body
  console.log(req.body)
  console.log("jobhis",jobhistoryid);
  
  await client.connect();
    //1.connect db
    const db= await client.db('jobseeker')
    //2.connect collection
    const collection=db.collection('jobshistory')
    
  
   
    

    const filter_update = {jobhistoryid:jobhistoryid}
    
    const addjob={applystatus:applystatus,updateon:new Date()}
    const result=await collection.deleteOne(filter_update,{$set:addjob})
    console.log(result);

    res.json(result)
       
  



})






app.post('/applyhistory',async(req,res)=>{


  let {memberid,companyname,position,salary,jobtype,jobdes,jobid} = req.body
  console.log(req.body)
  
  await client.connect();
    //1.connect db
    const db= await client.db('jobseeker')
    //2.connect collection
    const collection=db.collection('jobshistory')
    
   
  
    const addjob={memberid:memberid,jobid:jobid,
      companyname:companyname,position:position,salary:salary,
      jobtype:jobtype,jobdes:jobdes,createon:new Date(),applystatus:-1}

    const result=await collection.insertOne(addjob)
//update jobhistoryid
    const filter_update = {memberid:memberid,jobid:jobid}
    const cursor_update = await collection.findOne(filter_update)
    const history_update={jobhistoryid:result.insertedId.toString()}
    const result_update=await collection.updateOne(filter_update,{$set:history_update})


    res.json(result)
       
  

})


app.put('/EditcompanyJob/:companyid',async(req,res)=>{

  let {position,salary,jobtype,jobdes,positiongroup,province,jobqualification} = req.body
//console.log("edit profile",req.body)
  await client.connect();
    //1.connect db
    const db=await client.db('jobseeker')
    //2.connect collection
    const collection=db.collection('jobs')
    const filter={companyid:req.params.companyid,position:position};
    //console.log("edit member",memberid)
  
    const cursor = await collection.findOne(filter)
   
    
    
    if(!cursor)
    {
      res.json({

        valid:false,
        modifiedCount:0
    })

    }
    else
    {
      const job_update={salary:salary,positiongroup:positiongroup,province:province,jobdes:jobdes,jobtype:jobtype,jobqualification:jobqualification}
      const result=await collection.updateOne(filter,{$set:job_update})
      res.json({
        valid:true,
        modifiedCount:result.modifiedCount

      })

    }

    

})



app.post('/addjob',async(req,res)=>{


  let {companyid,position,salary,jobtype,jobdes,positiongroup,province,jobqualification} = req.body
  console.log(req.body)
  
  await client.connect();
    //1.connect db
    const db= await client.db('jobseeker')
    //2.connect collection
    const collection=db.collection('jobs')
    
  
    const addjob={companyid:companyid,position:position,positiongroup:positiongroup,province:province,salary:salary,jobtype:jobtype,jobdes:jobdes,jobqualification:jobqualification}
    const result=await collection.insertOne(addjob)

    res.json(result)
       
  

})


app.post('/addeducation',async(req,res)=>{


  let {memberid,university,major,gpa} = req.body
  console.log(req.body)
  
  await client.connect();
    //1.connect db
    const db= await client.db('jobseeker')
    //2.connect collection
    const collection=db.collection('educations')
    
  
    const education={memberid:memberid,university:university,major:major,gpa:gpa}
    const result=await collection.insertOne(education)

    res.json(result)
       
  
    


})


app.get('/experiences/:memberid',authenticateToken,async(req,res)=>{

  await client.connect();
  const db= await client.db('jobseeker')
  const collection =db.collection('experiences')
  var json=[]

  console.log(req.params.memberid)

  const filter={memberid:req.params.memberid};

  const data =await collection.find(filter);


  await data.forEach(document=>{

    json.push({
    
     email:document.email,
     datefrom:document.datefrom,
     dateto:document.dateto,
     company:document.company,
     position:document.position,
     salary:document.salary,
     jobdescription:document.jobdescription,

      
    })

  })

  res.json(json);





})


app.post('/addexperience',async(req,res)=>{

  let {memberid,datefrom,dateto,company,position,salary,jobdescription} = req.body

  await client.connect();

  const db=await client.db('jobseeker')
  //2.connect collection
  const collection=db.collection('experiences')

  const experience={memberid:memberid,datefrom:datefrom,dateto:dateto,company:company,position:position,salary:salary,jobdescription:jobdescription}
  const result=await collection.insertOne(experience)

    res.json(result)


})

app.get('/getEmailExists/:email',async(req,res)=>{
  const email=req.params.email;
  await client.connect();
  const db= await client.db('jobseeker')
  const collection =db.collection('members')
  const filter = {email:email}
  const cursor = await collection.findOne(filter)

  res.json({
    email:cursor.email,
    memeberid:cursor.memberid
  });


})

app.post('/registergmail',async(req,res)=>{

let {email,fullname} = req.body
await client.connect();
  const db= await client.db('jobseeker')
  const collection =db.collection('members')
  const filter = {email:email,signintype:"google"}
  const cursor = await collection.findOne(filter)

  if (!cursor){

    const memberupdate={email:email,password:"",signintype:"google",fullname:fullname}
    const result =await collection.insertOne(memberupdate)
   //insert cmmplte
    

    const filter_update = {email:email}
    const cursor_update = await collection.findOne(filter_update)
    const member_update={memberid:result.insertedId.toString()}
    const result_update=await collection.updateOne(filter,{$set:member_update})
    //set memberid


    var fs = require('fs');
    var dir = './memberimage/'+result.insertedId.toString();

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }

    res.json({
      memberid :result.insertedId.toString(),
      status: result.acknowledged
      })
    }else{
        res.json({
            memberid :cursor.memberid,
            status: true,
            valid: "duplicate"
        })
    }


})





app.post('/register',async(req,res)=>{

    let {email,password} = req.body
    await client.connect();
    const db= await client.db('jobseeker')
    const collection =db.collection('members')
    //validate email exists
    const filter = {email:email}
    const cursor = await collection.findOne(filter)
    if (!cursor){

    const hashpassword = await bcrypt.hash(password,10)
    
   
    const memberupdate={email:email,password:hashpassword}
    const result =await collection.insertOne(memberupdate)
   //insert cmmplte
    

    const filter_update = {email:email}
    const cursor_update = await collection.findOne(filter_update)
    const member_update={memberid:result.insertedId.toString()}
    const result_update=await collection.updateOne(filter,{$set:member_update})
    //set memberid


    var fs = require('fs');
    var dir = './memberimage/'+result.insertedId.toString();

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }

    res.json({
      memberid :result.insertedId.toString(),
      status: result.acknowledged
      })
    }else{
        res.json({
            memberid :"0",
            status: false,
            valid: "duplicate"
        })
    }
})



app.get('/registers',async(req,res)=>{
    await client.connect();
    const db=await client.db('jobseeker')
    const collection=db.collection('members')
    const cursor=collection.find();

    let json=[];
  
    await cursor.forEach(document=>{
  
      json.push({
      
       memberid:document.memberid,
       email:document.email,
       firstname:document.firstname,
        
      })

    })

    res.json(json);



  });


app.get('/getregister/:memberid',authenticateToken,async(req,res)=>{

  try {

    await client.connect();
    const db= await client.db('jobseeker')
    const collection =db.collection('members')
    console.log(req.params.memberid)


  const logcollection = db.collection('applog')
  const applog={createby:req.params.memberid,log_date:new Date(),remark:`getregister`,logtype:"getregister",ipaddress:""}
  const logresult = await logcollection.insertOne(applog)
    
   // const filter = {email:req.params.email}
    const filter={memberid:req.params.memberid};
    const cursor = await collection.findOne(filter)
    console.log(cursor)
    /*let json=[];
  
    await cursor.forEach(document=>{
  
      json.push({
      
       memberid:document._id,
       email:document.email
        
      })

    })*/

    res.json(

        {
            
            email:cursor.email,
            fullname:cursor.fullname,
            phoneno:cursor.phoneno,
            image:cursor.image,
        }

    );
  }
  //Exception MongoExceoption 
  catch(error){

    res.json(

      {
          error:"Error to load data",
          email:"",
          fullname:"",
          phoneno:"",
          image:"",
      }
 ) }

})

app.put('/updatemember',async(req,res)=>{

    let{memberid,firstname,lastname,phoneno,address} = req.body

    await client.connect();
    //1.connect db
    const db=await client.db('jobseeker')
    //2.connect collection
    const collection=db.collection('members')
    const filter={memberid:memberid}
    const updatemember={firstname:firstname,lastname:lastname,phoneno:phoneno,address:address}
    const result=await collection.updateOne(filter,{$set:updatemember})

    res.json(
        result
    )

})
app.post('/testupload/:memberid',async(req,res)=>{

console.log(req.params.memberid);
res.send(req.params.memberid);

});


app.post('/uploadcompany/:companyid',companyupload.single('fileupload'),async(req,res)=>{


  console.log("begin upload");
  if(!req.file)
  {
  
    return res.status(400).send("no file upload")
  
  }
  
  
  
  
  
  console.log("file after upload")
  console.log(req.body)
  console.log(req.file)
  
  let companyid=req.params.companyid;
  console.log(companyid);
  await client.connect();
  //1.connect db
  const db=await client.db('jobseeker')
  //2.connect collection
  const collection=db.collection('companies')
  const filter={companyid:companyid};
  const company_upload={image:req.file.originalname}
  const result=await collection.updateOne(filter,{$set:company_upload})
  
  
  res.send("upload success ")
  
  }
  
  
  
  );


  app.get('/companyimage/:companyid',async (req, res) => {
    const companyid = req.params.companyid
    await client.connect();
    const db=await client.db('jobseeker')
    const collection=db.collection('companies')
    const query={companyid:req.params.companyid};
    const cursor=collection.find(query);
  
   let image="";
  
   await cursor.forEach(document=>{
    if (document.image){
    image=document.image;
    
    }
    
   });
  console.log(image)
  
    res.sendFile(__dirname + '/companyimage/'+companyid+'/'+image); 
  
    
  });








//upload member image profile
app.post('/upload/:memberid',upload.single('fileupload'),async(req,res)=>{


console.log("begin upload");
if(!req.file)
{

  return res.status(400).send("no file upload")

}





console.log("file after upload")
console.log(req.body)
console.log(req.file)

let memberid=req.params.memberid;
console.log(memberid);
await client.connect();
//1.connect db
const db=await client.db('jobseeker')
//2.connect collection
const collection=db.collection('members')
const filter={memberid:memberid};
const member_upload={image:req.file.originalname}
const result=await collection.updateOne(filter,{$set:member_upload})


res.send("upload success ")

}



);
app.get('/image/:memberid',async (req, res) => {
  const memberid = req.params.memberid
  await client.connect();
  const db=await client.db('jobseeker')
  const collection=db.collection('members')
  const query={memberid:req.params.memberid};
  const cursor=collection.find(query);

 let image="";

 await cursor.forEach(document=>{
  if (document.image){
  image=document.image;
  
  }
  
 });
console.log(image)

  res.sendFile(__dirname + '/memberimage/'+memberid+'/'+image); 

  
});

  app.get('/listdb',async(req,res)=>{

    await client.connect();
    const dblist=await client.db().admin().listDatabases();


    let json=[];
    var id=0;
    dblist.databases.forEach(db=>{
        id++;
        json.push({
            dbid:id,
            dbname:db.name

        });
  

    })

    res.json(json)




  })
  app.get('/listtable/:dbname',async(req,res)=>{

    await client.connect();
    const db=await client.db(req.params.dbname)

    const collections=await db.listCollections().toArray();


    let json=[];
    var id=0;
    collections.forEach(tb=>{
        id++;
        json.push({
            tableid:id,
            table:tb.name

        });
  

    })

    res.json(json)




  })

  app.get('/adddata',async(req,res)=>{

    await client.connect();
    const db=await client.db('donut')

    const collection=db.collection('products')

    const product={id:2,productname:"sofa",price:6000}

    const result =await collection.insertOne(product)
   
    res.json(result)




  })
  app.get('/products',async(req,res)=>{
    await client.connect();
    const db=await client.db('donut')
    const collection=db.collection('products')
    const cursor=collection.find();

    let json=[];
  
    await cursor.forEach(document=>{
  
      json.push({
       id:document.id,
       sysid:document._id,
       name:document.productname,
       price:document.price,
       image:document.image
        
      })

    })

    res.json(json);



  });

  app.get('/editproduct/:id',async(req,res)=>{
    await client.connect();
    //1.connect db
    const db=await client.db('donut')
    //2.connect collection
    const collection=db.collection('products')
    const filter={id:parseInt(req.params.id)};
    const product_update={price:900}
    const result=await collection.updateOne(filter,{$set:product_update})



 

    res.json(result);



  });






  app.listen(port,()=>{
    console.log(`server server ${port} `)
})