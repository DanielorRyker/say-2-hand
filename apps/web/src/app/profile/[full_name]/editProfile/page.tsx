'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styleLogin from '@/app/auth/login/login.module.css'
import styleRegister from '@/app/auth/register/register.module.css'
import { useState } from "react";
import axios from "axios";

const Home =()=>{



    const router = useRouter()

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
        <div className={styleLogin['container']}>
            <div className={styleRegister['card']}>
                
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
                </div>
               
              
            </div>          
        </div>
        
       
    )
}



export default Home;