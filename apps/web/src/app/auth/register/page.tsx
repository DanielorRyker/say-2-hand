'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styleLogin from '@/app/auth/login/login.module.css'
import styleRegister from '@/app/auth/register/register.module.css'
import { useState } from "react";
import axios from "axios";

const Home =()=>{

    const [form, setForm] = useState({ email: "", password_hash: "" ,full_name:""});
    const [rePassword_hash,setRePassword_hash]= useState("")
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    };
     const [loading, setLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showRePassword, setShowRePassword] = useState(false);

    const checkIcons = {
    on: "/image/register/VectorCheckOn.svg",
    off: "/image/register/VectorCheckOff.svg",
    };

   //chekbox
   const [isChecked, setIsChecked] = useState(false);

    // validate
    const isValidLength = form.password_hash.length >= 8 && form.password_hash.length <= 32;
    const hasNumber = /\d/.test(form.password_hash);
    const hasUpperCase = /[A-Z]/.test(form.password_hash);
    const hasLowerCase = /[a-z]/.test(form.password_hash);
    const validateEmail =/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

    const router = useRouter()

    const handleBtn=async ()=>{
        if (!form.email || !form.password_hash ||!form.full_name||!rePassword_hash) {
            alert("Vui lòng nhập đầy đủ thông tin");
            return;
        }
        if (form.password_hash!=rePassword_hash) {
            alert("Mật khẩu nhập lại không khớp !");
            return;
        }
        if (!isValidLength || !hasNumber ||!hasUpperCase||!hasLowerCase) {
            alert("Mật khẩu không đúng định dạng !");
            return;
        }
        if (!isChecked) {
            alert("Bạn cần đồng ý Điều khoản trước khi đăng ký!");
            return;
        }
        if (!validateEmail) {
            alert("Email không hợp lệ!");
            return;
        }

        try {
             setLoading(true);

            const res = await axios.post(
            "http://localhost:8080/api/users/", // API NestJS
            form,
            { withCredentials: true } // nếu BE dùng cookie/session
            );
            alert("Mã xác nhận đã được gửi tới email");
            router.push("/auth/login");
         } catch (error) {
            console.error(error);
            alert("Có lỗi xảy ra, vui lòng thử lại");
         }finally {
            setLoading(false);
        }
    }

    return(
        <div className={styleLogin['container']}>
            <div className={styleRegister['card']}>
                <div>
                    <p className={styleLogin['title']}>Đăng ký tài khoản</p>
                </div>

                <div className={styleLogin['gradientBorder']} >
                    <input
                        type="text"
                        placeholder="Nhập họ và tên"
                        className={styleLogin['input']}
                        value={form.full_name}
                        name="full_name"
                        onChange={handleChange}
                    />
                </div>

                <div className={styleLogin['gradientBorder']} >
                    <input
                        type="text"
                        placeholder="Nhập Email hoặc số điện thoại"
                        className={styleLogin['input']}
                        value={form.email}
                        name="email"
                        onChange={handleChange}
                    />
                </div>

                <div className={styleLogin['gradientBorder']}>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu"
                        className={styleLogin['input_password']}
                        value={form.password_hash}
                        name="password_hash"
                        onChange={handleChange}
                    />
                    <img
                        src={showPassword ? "/image/login/mdi_eye_on.svg" : "/image/login/mdi_eye-off.svg"}
                        alt="Toggle visibility"
                        className={showPassword ? styleLogin['eyeIcon2'] : styleLogin['eyeIcon1']}
                        onClick={() => setShowPassword(!showPassword)}
                    />
                </div>
                <div className={styleLogin['gradientBorder']}>
                    <input
                       type={showRePassword ? "text" : "password"}
                        placeholder="Nhập lại mật khẩu"
                        className={styleLogin['input_password']}
                        value={rePassword_hash}
                        name="rePassword_hash"
                        onChange={(e) => setRePassword_hash(e.target.value)}
                    />
                    <img
                        src={showRePassword ? "/image/login/mdi_eye_on.svg" : "/image/login/mdi_eye-off.svg"}
                        alt="Toggle visibility"
                        className={showRePassword ? styleLogin['eyeIcon2'] : styleLogin['eyeIcon1']}
                        onClick={() => setShowRePassword(!showRePassword)}
                    />
                </div>

                <div className={styleRegister['gridContainer']}>
                    <div className={styleRegister['frame1']}>
                        <img src={isValidLength ? checkIcons.on : checkIcons.off} alt="check" className={styleRegister['checkIcon']}/> 
                        <p>Giới hạn từ 8-32 ký tự</p>
                    </div>
                    <div className={styleRegister['frame1']}>
                        <img src={hasNumber ? checkIcons.on : checkIcons.off} alt="check" className={styleRegister['checkIcon']}/> 
                        <p>Tối thiểu 01 chữ số</p>
                    </div>
                    <div className={styleRegister['frame1']}>
                        <img src={hasUpperCase ? checkIcons.on : checkIcons.off} alt="check" className={styleRegister['checkIcon']}/> 
                        <p>Tối thiểu 01 ký tự IN HOA</p>
                    </div>
                    <div className={styleRegister['frame1']}>
                        <img src={hasLowerCase ? checkIcons.on : checkIcons.off} alt="check" className={styleRegister['checkIcon']}/> 
                        <p>Tối thiểu 01 ký tự in thường</p>
                    </div>
                </div>

                <div style={{display:'flex', fontSize:16,gap: 10}}>
                    <label className={styleRegister['custom-checkbox']}>
                        <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={(e) => setIsChecked(e.target.checked)}
                        />
                        <span className={styleRegister['checkmark']} ></span>
                    </label>

                    <p>Bằng việc Đăng ký, bạn đã đọc và đồng ý với Điều khoản sử dụng và Chính sách bảo mật của Say2Hand</p>
                </div>

                <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                    <button className={styleLogin['btnLogin']}  onClick={()=> handleBtn()} disabled={loading}><p style={{fontSize: '28px',fontWeight: 'bold',marginTop:10}}>Tạo tài khoản</p></button>
                </div>

                <div className={styleLogin['cardline']}>
                    <div className={styleLogin['line']} ></div>
                            <span className={styleLogin['linetext']}>
                                Hoặc đăng nhập bằng
                            </span>
                     <div className={styleLogin['line']} ></div>
                </div>

                <div style={{display:'flex',gap:10}}>
                    <button className={styleLogin['btnIcon']} >
                            <img src="/image/login/IconGoogle.png" alt="Google" className={styleLogin['imgIcon']} />                  
                    </button>
                    <button className={styleLogin['btnIcon']} >
                            <img src="/image/login/IconFacebook.png" alt="Facebook" className={styleLogin['imgIcon']} />
                    </button>
                </div>

                <div style={{display:'flex'}}>
                    <p style={{fontWeight:'bold',fontSize:18}}>Bạn đã có có tài khoản ? </p>
                    <Link href="/auth/login" style={{fontWeight:'bold',fontSize:18, color:'#3B82F6'}}> Đăng nhập ngay</Link>
                </div>
            </div>          
        </div>
        
       
    )
}



export default Home;