"use client";
import { useEffect, useState } from "react";
import styles from "./post.module.scss";
import Image from "next/image";
import axios from "axios";


const Home = () => {

 interface Post {
    _id: string;
    title: string;
    // images: { url: string }[];
    image?: string;
    price: number;
    transaction_type: string;
    // location: { address: string };
    address: string;
    author_id: {_id: string; full_name: string; avatar: string };
    createdAt: string;
    reputation?: { average_score: number; total_ratings: number };
    condition: string;
    category_id: { name: string };
    stats?: { view_count: number; favorite_count: number };
    distance_km?: number;
    status: string;
  }

const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    const storedPost = localStorage.getItem("post");
    if (storedPost) {
      const parsedPost: Post = JSON.parse(storedPost);
      setPost(parsedPost);
    }
  }, []);

  const isSell = post?.transaction_type === "sell";
  let priceHtml;

  const getRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Vừa xong";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} tháng trước`;
    const years = Math.floor(months / 12);
    return `${years} năm trước`;
  };

  //Lấy User
  const [user, setUser] = useState<{
    _id: string;
    email: string;
    full_name: string;
    role: string;
    phone_number: string;
    address: string;
    description: string;
    avatar: string;
  } | null>(null);

useEffect(() => {
  if (!post?.author_id) return; // tránh gọi khi chưa có id

  async function fetchUser() {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/users/${
          typeof post?.author_id === "string" ? post.author_id : post?.author_id._id
        }`
      );
      setUser(res.data);
      console.log("user", res.data);
    } catch (err) {
      console.error("Lỗi fetch user:", err);
    }
  }

  fetchUser();
}, [post?.author_id]); 

const [flagPN, setFlagPN] = useState<boolean>(false);
function showhidePN(){
  if(flagPN==true){
    setFlagPN(false)
  }
  else{
    setFlagPN(true)
  }
}

    return(
        <div className={styles.container}>
            <div className={styles.gradientBorder}>
<div className={styles.card}>
                   <div className={styles.groupLeft}>
                        <Image 
                        src={post?.image ?process.env.NEXT_PUBLIC_URL_GCS+post?.image: "/image/profile/camera.svg"}                                  
                        alt={""} className={styles.imgPost} width={100} height={100}/>

                        <div className={styles.listImg}></div>
                   </div>

                   <div className={styles.groupRight}>

                        <div className={styles.cardTitle} >
                            <p className={styles.title}>{post?.title}</p>
                            <button className={styles.loveButon}>
                                <Image src={"/image/post/black_heart.svg"}
                                 alt={""}  width={30} height={30} />
                                 <p className={styles.textBtn}>Lưu</p>
                            </button>
                        </div>
                        
                     <div>
                        {isSell ? (
                            <span className={styles.price}>
                            {`${new Intl.NumberFormat("vi-VN").format(post?.price)} VNĐ`}
                            </span>
                        ) : (
                            <span className={styles.price}>
                            {post?.transaction_type === "exchange" ? "Trao đổi" : "Cho tặng"}
                            </span>
                        )}
                    </div>

                        <div className={styles.groupInfo}>
                            <Image src={"/image/profile/map.svg"} alt="" width={18} height={18}/>
                            <p className={styles.textInfo}> {post?.address}</p>
                        </div>

                        <div className={styles.groupInfo}>
                            <Image src={"/image/post/time.svg"} alt="" width={18} height={18}/>
                            <p className={styles.textInfo}> {post?.createdAt ? getRelativeTime(post.createdAt) : ""}</p>
                        </div>

                        <div className={styles.cardBtn}>
                            <button className={styles.btnPN}  onClick={showhidePN}>
                                <p>Hiện số</p>  
                                 {flagPN?(
                                    <p >{user?.phone_number}</p>
                                    
                                 ):(
                                    <p>**********</p>
                                 )}
                                </button>
                            <button className={`${styles.btnPN} ${styles.btnMesage}`}>
                                <Image src={"/image/post/chat.svg"} width={32} height={32} alt="" className={styles.imgBtn}/>
                                 Chat
                            </button>
                        </div>

                        <div className={styles.cardUser}>
                             <Image
                                src={user?.avatar ? process.env.NEXT_PUBLIC_URL_GCS + user.avatar : "/image/header/carbon_user-avatar-filled-alt.svg"}
                                alt=""
                                className={styles.imgAvatar}
                                width={60}
                                height={60}
                                />
                                <p >{user?.full_name}</p>
                        </div>

                   </div>

            </div>
            </div>
            
        </div>

    );
};
export default Home;