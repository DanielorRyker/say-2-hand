'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styleLogin from '@/app/auth/login/login.module.css'
import styleRegister from '@/app/auth/register/register.module.css'
import { useEffect, useState } from "react";
import axios from "axios";
import styleUser from '@/app/profile/user.module.css'

const Home =()=>{



    const router = useRouter()
    const [form, setForm] = useState({_id:"", email: "", full_name: "" ,phone_number:"",address:"",description:"",avatar:""});

    const [user, setUser] = useState<{
        _id: string;
        email: string;
        full_name: string;
        role: string;
        phone_number:string;
        address: string;
        description:string;
        avatar:string;
      } | null>(null);
    
       useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // cập nhật email vào form luôn
         setForm((prev) => ({
          ...prev,
          _id: parsedUser._id || "",
          email: parsedUser.email || "",
          full_name: parsedUser.full_name || "",
          phone_number: parsedUser.phone_number || "",
          address: parsedUser.address || "",
          description: parsedUser.description || "",
          avatar: parsedUser.avatar || ""
        }));

        }
      }, []);
      
      const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
      };


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

  const handleUpload = async () => {
    if (!file) return alert("Vui lòng chọn file!");

    const formData = new FormData();
    formData.append("file", file); // phải trùng với FileInterceptor('file')

    try {
      const res = await axios.post("http://localhost:8080/api/upload/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadedUrl(res.data.url);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

    

    return(
        <div className={styleUser['container']} >
            <div className={styleUser['gradientBorder']} >
                 <div className={styleUser['card']} style={{paddingTop:50}}>

              <div className={styleUser['gradientBorderAvatar']}>
                <div className={styleUser['cardChangeAvatar']}>
                  <img src="/image/profile/camera.svg" alt=""  className={styleUser['changeAvatarImg']}/>
                </div>
              </div>


              <div>
                <button className={styleUser['btnChangeAvatar']} >Đổi ảnh đại diện</button>
              </div>

              <div style={{padding:50}}>
                <div className={styleUser['gradientBorderInfo']}>
                  <div className={styleUser['changeInfoCar']} >
                    <label className={styleUser['infoLable']}>Tên tài khoản :</label>
                    <input type="text" 
                    placeholder="Nhập tên tài khoản" 
                    className={styleUser['inputInfo']}
                    value={form.full_name}
                    name="full_name"
                    onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styleUser['gradientBorderInfo']}>
                  <div className={styleUser['changeInfoCar']} >
                    <label className={styleUser['infoLable']}>Số điện thoại :</label>
                    <input type="text" 
                    placeholder="Nhập số điện thoại" 
                    className={styleUser['inputInfo']}
                    value={form.phone_number}
                    name="phone_number"
                    onChange={handleChange}
                    />
                  </div> 
                </div>

                <div className={styleUser['gradientBorderInfo']}>
                  <div className={styleUser['changeInfoCar']} >
                    <label className={styleUser['infoLable']}>Địa chỉ :</label>
                    <input type="text" 
                    placeholder="Nhập địa chỉ" 
                    className={styleUser['inputInfo']}
                    value={form.address}
                    name="address"
                    onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styleUser['gradientBorderInfo']} >
                  <div className={styleUser['textAreaDescriptionCar']} >
                    <label className={styleUser['infoLable']}>Giới thiệu :</label>
                    <textarea
                       
                        placeholder="Nhập giới thiệu về bản thân"
                        className={styleUser['textAreaDescription']}
                        value={form.description}
                        name="description"
                        onChange={handleChange}
                      />
                  </div>
                </div>

                <button className={styleUser['btnConfirm']}>Xác nhận</button>

              </div>
              

              
                
                {/* Upload anh
                <div>
                    <h2>Upload Avatar</h2>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{width: 300,height:120,background:'red'}}/>
                    {preview && <img src={preview} alt="preview" width="120" />}
                    <br />
                    <button onClick={handleUpload} style={{width: 300,height:120,background:'blue'}}>Upload</button>

                    {uploadedUrl && (
                        <div>
                        <p>Uploaded Avatar:</p>
                        <img src={uploadedUrl} alt="uploaded" width="120" height="120" style={{width: 120,height:120}}/>
                        <p>URL: {uploadedUrl}</p>
                        </div>
                    )}
                </div> */}
               
              </div>
            </div>          
        </div>
        
       
    )
}



export default Home;