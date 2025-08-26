'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styleLogin from '@/app/auth/login/login.module.css'
import styleRegister from '@/app/auth/register/register.module.css'
import styleUser from '@/app/profile/user.module.css'
import { useEffect, useState } from "react";
import axios from "axios";

const Home =()=>{



    const router = useRouter()

   const [user, setUser] = useState<{
    _id: string;
    email: string;
    full_name: string;
    role: string;
    phone_number:string;
    address: string;
    description:string;
  } | null>(null);

  useEffect(() => {
    // chạy ở client sau khi render
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  //Đăng xuất
   const handleLogout=()=>{
    localStorage.clear();
    router.push("/auth/login");
   }
   //Chỉnh sủa thông tin cá nnhân
   const handleEdit=()=>{
    
    router.push("/profile/"+user?.full_name+"/editProfile");
   }

   //Đổi mật khẩu
   const handleChangePassword=()=>{
    
    router.push("/profile/"+user?.full_name+"/changePassword");
   }

    return(
        <div className={styleUser['container']} >
            <div className={styleUser['gradientBorder']} >
                 <div className={styleUser['card']}>

                <div className={styleUser['cardAvatarBackground']}>
                    <img src="/image/header/carbon_user-avatar-filled-alt.svg" alt=""className={styleUser['avatarImg']} /> 
                </div>

                <div >
                     <p className={styleUser['title']}>{user?.full_name}</p>
                </div>

                    <div className={styleUser['cardAllInfo']}>
                        <div className={styleUser['cardInfo']}>
                            <img src="/image/profile/mail.svg" alt="" className={styleUser['iconImg']}/>
                            <p style={{fontWeight:'bold'}}>Email: </p>
                        <p className={styleUser['']}>{user?.email}</p>

                        </div>

                        <div className={styleUser['cardInfo']}>
                            <img src="/image/profile/phone.svg" alt="" className={styleUser['iconImg']}/>
                            <p style={{fontWeight:'bold'}}>Số điện thoại: </p>
                            {user?.phone_number ?  <p className={styleUser['']}>{user?.phone_number}</p> :<p className={styleUser['']}>đang cập nhật</p>}
                        </div>

                        <div className={styleUser['cardInfo']}>
                            <img src="/image/profile/map.svg" alt="" className={styleUser['iconImg']}/>
                            <p style={{fontWeight:'bold'}}>Địa chỉ: </p>
                        {user?.address ?  <p className={styleUser['']}>{user?.address}</p> :<p className={styleUser['']}>đang cập nhật</p>}
                        </div>

                        
                        <div className={styleUser['cardInfo']}>
                            <img src="/image/profile/detail.svg" alt="" className={styleUser['iconImg']}/>
                            <p style={{fontWeight:'bold',whiteSpace:'nowrap'}}>Giới thiệu: </p>
                            {user?.description ?  <p className={styleUser['']}> </p> :<p style={{ wordWrap: 'break-word',maxWidth:300}}>đang cập nhật</p>}
                        </div>

                        <div className={styleUser['cardInfo']}>
                            {user?.description ?  <p className={styleUser['']}>{user?.description}</p> :  <p className={styleUser['describe']}>Sáng sớm ngày 26/8, bão Kajiki (hay bão số 5) đã suy yếu thành áp thấp .</p>}
                        </div>
                    

                    </div>

                <div  >
                    <button className={styleUser['btnProfile']} onClick={()=> handleEdit()}><p className={styleUser['textBtn']}>Chỉnh sửa trang cá nhân</p></button>
                </div>

                <div >
                    <button  className={styleUser['btnProfile']} onClick={()=> handleChangePassword()}><p className={styleUser['textBtn']}>Đổi mật khẩu</p></button>
                </div>

                <div  className={styleUser['gradientBorderLogout']}>
                    <button className={styleUser['btnLogout']} onClick={()=> handleLogout()}><p className={styleUser['textBtn']}>Đăng xuất</p></button>
                </div>

               

             

               
               
            </div>    
            </div>
                 
        </div>
        
       
    )
}



export default Home;

function setUser(arg0: any) {
    throw new Error('Function not implemented.')
}
