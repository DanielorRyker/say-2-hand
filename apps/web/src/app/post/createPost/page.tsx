"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styleUser from '@/app/profile/user.module.css'
import stylePost from '@/styles/pages/post/post.module.scss'
import axios from "axios";
import { useState } from "react";
import { NumericFormat } from "react-number-format";



const Home = () => {
  const router = useRouter()
  const [form, setForm] = useState({author_id:"", title: "", description: "" ,condition:"",category_id:"",location:"",transaction_type:"",price:"",});

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
    const [category, setCategory] = useState("");
    const handleSeletChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
  };

  //chọn tình trạng
  const [condition, setCondition] = useState("");

  //Nhập giá 
   const [price, setPrice] = useState("");


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
                        value={category}
                        onChange={handleSeletChange}
                         className={stylePost['select']}
                      >
                        <option value="" >--- Danh mục ---</option>
                        <option value="clothes">Quần áo</option>
                        <option value="electronics">Điện tử</option>
                        <option value="books">Sách</option>
                        <option value="furniture">Đồ nội thất</option>
                        <option value="household">Đồ gia dụng</option>
                      </select>
                  </div>

                    <div  className={stylePost['groupInfo']}>
                      <label htmlFor="" className={stylePost['labelInfoDetail']}>Thông tin chi tiết</label>

                      <div style={{display:"flex",alignItems:"center",gap:'20px'}}>
                        <div style={{ display: "flex",  }}>
                          <label htmlFor="" style={{fontWeight: "bold",fontSize:'18px'}}>Tình trạng&nbsp;</label> <p style={{ color: "red" }}>*</p>
                        </div>
                        <div className={stylePost['gradientBorderCondition']}>
                          <button className={stylePost['btnCondition']}>Đã sử dụng</button>
                        </div>
                        <div className={stylePost['gradientBorderCondition']}>
                          <button className={stylePost['btnCondition']}>Mới</button>
                        </div>
                      </div>
                      
                      <div className={stylePost['gradientBorderInfo']}>
                        {/* <input className={stylePost['input']} type="number" placeholder="Nhập giá bán VD:100000 vnđ"/> */}
                        <NumericFormat
                        value={price}
                        thousandSeparator="."
                        decimalSeparator=","
                        suffix=" ₫"
                        allowNegative={false}
                        placeholder="Nhập giá sản phẩm"
                        className={stylePost['input']}
                        onValueChange={(values) => {
                          setPrice(values.value); // số gốc: 1000000
                          console.log("Giá trị gốc:", values.value);
                          console.log("Hiển thị:", values.formattedValue);
                        }}
                      />
                      </div>
                    </div>

                    <div className={stylePost['groupInfo']}>
                        <label htmlFor="" className={stylePost['labelInfoDetail']}>TIêu đề và mô tả</label>

                        <div className={stylePost['gradientBorderInfo']}>
                          <input type="text" className={stylePost['input']} placeholder="Tiêu đề tin đăng"/>
                        </div>
                        <div className={stylePost['gradientBorderTextArea']}>
                          <textarea className={stylePost['textArea']} placeholder="Mô tả chi tiết"></textarea>
                        </div>
                        <div className={stylePost['gradientBorderInfo']}>
                          <input type="text" className={stylePost['input']} placeholder="Địa chỉ"/>
                        </div>
                    </div>

                    <button className={stylePost['btnPost']}>Đăng tin</button>

                </div>
          

          

         </div>
         </div>
                 

         
          
 
        
       

 
    </div>
  );
};

export default Home;






