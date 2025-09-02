"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styleUser from '@/app/profile/user.module.css'
import stylePost from '@/styles/pages/post/post.module.scss'
import axios from "axios";
import { useEffect, useState } from "react";
import { NumericFormat } from "react-number-format";



const Home = () => {
  const router = useRouter()
  const [form, setForm] = useState({
    author_id:"", 
    title: "", 
    description: "" ,
    condition:"used",
    category_id:"",
    address:"",
    transaction_type:"",
    price:"",
    image:""});

 useEffect(() => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    setForm((prev) => ({ ...prev, author_id:  parsed._id }));
  }
}, []);

  
  //Xử lý ảnh
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0] || null;
      setFile(selected);
      if (selected) {
        setPreview(URL.createObjectURL(selected));
      }
    };


    //chọn danh mục
    type Category = { _id: string; name: string };
    const [categories, setCategories] = useState<Category[]>([]);

      const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setForm({ ...form, category_id: e.target.value });
    };
    useEffect(() => {
      const fetchCategories = async () => {
        try {
          const res = await fetch("http://localhost:8080/api/categories/");
          const data = await res.json();
          setCategories(data);
        } catch (error) {
          console.error("Lỗi load categories:", error);
        }
      };
      fetchCategories();
    }, []);


  //lấy dữ liệu
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{
    _id: string;
    email: string;
    full_name: string;
    role: string;
    phone_number: string;
    address: string;
    description: string;
    image: string;
  } | null>(null);

    useEffect(() => {
      setMounted(true);
      // chạy ở client sau khi render
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        console.log("user:",JSON.parse(storedUser));
      }
    }, []);

      if (!mounted) return null;

      const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
      };

  const handlePost=async ()=> {
    if (!file) return alert("Vui lòng chọn ảnh!");
    if(form.category_id===""||form.title===""||form.description===""||form.condition==="")
      {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
      }

      try {

        const formData = new FormData();
        formData.append("file", file);

        
        const postImg = await axios.post(
      "http://localhost:8080/api/upload/postIMG",
      formData,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
       
          // if (postImg) {
          //     setForm({ ...form, image: postImg.data.filename });
          // }
           const uploadedFilename = postImg.data.filename;
       
        await axios.post(
          "http://localhost:8080/api/posts/",
          { ...form, image: uploadedFilename },
           { withCredentials: true }
      );
      alert("Tạo bài đăng thành công!");
      router.push("/");
    } catch (error) {
       console.error("Post creation failed:", error);
    }
   
  }

  return (
     <div className={stylePost['container']} >
            <div className={stylePost['gradientBorder']} >
                 <div className={stylePost['card']}>

                {/* thẻ trái */}
                <div className={stylePost['cardLeft']}>
                  <div className={stylePost['labelLeft']}>
                     <label htmlFor="">Hình ảnh sản phẩm&nbsp;</label>
                      <p style={{ color: "red" }}>*</p>
                  </div>
                 
                 {/* Chọn ảnh */}
                  {preview ? (
                <div>
                  <input
                      type="file"
                      accept="image/*"
                      id="upload-avatar"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  <label htmlFor="upload-avatar">
                      <img src={preview} alt="preview" className={stylePost['avatarImgNew']} />
                  </label>
                 
                </div>
              ) : (
                <div className={stylePost['gradientBorderAvatar']}>
                  <div className={stylePost['cardChangeAvatar']}>
                    <input
                      type="file"
                      accept="image/*"
                      id="upload-avatar"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                    <label htmlFor="upload-avatar">
                      <img
                        src="/image/profile/camera.svg"
                        alt="Upload avatar"
                        className={stylePost['changeAvatarImg']}
                      />
                    </label>
                  </div>
                </div>
              )}
                </div>

                {/* thẻ phải */}
                
                <div className={stylePost['cardRight']}>
                  
                  <div className={stylePost['gradientBorderInfo']}>
                      <select
                            id="category"
                            value={form.category_id}
                            onChange={handleSelectChange}
                            className={stylePost["select"]}
                          >
                            <option value="">--- Danh mục ---</option>
                            {categories.map((cat) => (
                              <option key={cat._id} value={cat._id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                  </div>

                    <div  className={stylePost['groupInfo']}>
                      <label htmlFor="" className={stylePost['labelInfoDetail']}>Thông tin chi tiết</label>

                      <div style={{display:"flex",alignItems:"center",gap:'20px'}}>
                        <div style={{ display: "flex",  }}>
                          <label htmlFor="" style={{fontWeight: "bold",fontSize:'18px'}}>Tình trạng&nbsp;</label> <p style={{ color: "red" }}>*</p>
                        </div>
                        

                        {form.condition !== "new" && (
                          <>
                          <div style={{width:'130px'}}>
                             <button onClick={() => setForm({ ...form, condition: "new" })} className={stylePost['btnCondition']}>Mới</button>
                          </div>
                          <div className={stylePost['gradientBorderCondition']}>
                              <button onClick={() => setForm({ ...form, condition: "used" })} className={stylePost['btnCondition']}>Đã sử dụng</button>
                          </div>
                            </>
                        )}
                        {form.condition !== "used" && (
                          <>
                           <div className={stylePost['gradientBorderCondition']}>
                             <button onClick={() => setForm({ ...form, condition: "new" })} className={stylePost['btnCondition']}>Mới</button>
                          </div>
                          <div style={{width:'130px'}}>
                              <button onClick={() => setForm({ ...form, condition: "used" })} className={stylePost['btnCondition']}>Đã sử dụng</button>
                          </div>
                            </>
                        )}

                      </div>
                      
                      <div className={stylePost['gradientBorderInfo']}>
                        {/* <input className={stylePost['input']} type="number" placeholder="Nhập giá bán VD:100000 vnđ"/> */}
                        <NumericFormat
                        name='price'
                        value={form.price}
                        thousandSeparator="."
                        decimalSeparator=","
                        suffix=" ₫"
                        allowNegative={false}
                        placeholder="Nhập giá sản phẩm"
                        className={stylePost['input']}
                         onValueChange={(values) => {
                        setForm((prev) => ({
                          ...prev,
                          price: values.value, // giá trị số gốc (1000000)
                          transaction_type:
                            values.value === "" || Number(values.value) === 0
                              ? "free"
                              : "sell",
                              }));
                      }}
                        // onChange={handleChange}
                      />
                      </div>
                    </div>

                    <div className={stylePost['groupInfo']}>
                        <label htmlFor="" className={stylePost['labelInfoDetail']}>TIêu đề và mô tả</label>

                        <div className={stylePost['gradientBorderInfo']}>
                          <input onChange={handleChange} name='title' value={form.title} type="text" className={stylePost['input']} placeholder="Tiêu đề tin đăng"/>
                        </div>
                        <div className={stylePost['gradientBorderTextArea']}>
                          <textarea onChange={handleChange} name='description' value={form.description} className={stylePost['textArea']} placeholder="Mô tả chi tiết"></textarea>
                        </div>
                        <div className={stylePost['gradientBorderInfo']}>
                          <input onChange={handleChange} name='address' value={form.address} type="text" className={stylePost['input']} placeholder="Địa chỉ"/>
                        </div>
                    </div>

                    <button className={stylePost['btnPost']} onClick={handlePost}>Đăng tin</button>

                </div>
          

          

         </div>
         </div>
                 

         
          
 
        
       

 
    </div>
  );
};

export default Home;






