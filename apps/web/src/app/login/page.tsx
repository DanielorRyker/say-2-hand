'use client'
import { useRouter } from 'next/navigation'


const Home =()=>{

    const router = useRouter()

    const handleBtn=()=>{
        router.push("/")
    }

    return(
        <div  style={styles.container}>
            <div style={{
                width: '900px',
                height: '600px',
                borderRadius: 50,
                background: 'linear-gradient(to right, #BFDBFE, #A7F3D0)',
                display: 'flex',  
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap:20
                
            }}>
                
                <div>
                    <p style={styles.title}>Đăng nhập</p>
                </div>
                
                
              <div style={styles.gradientBorder}>
                    <input
                        type="text"
                        placeholder="Email hoặc số điện thoại"
                        style={styles.input}
                    />
                </div>

                <div style={styles.gradientBorder}>
                    <input
                        type="password"
                        placeholder="Mật khẩu"
                        style={styles.input_password}
                    />
                    <img
                        src="/mdi_eye-off.png"
                        alt="Toggle visibility"
                            style={{
                                position: 'absolute',
                                right: '15px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '24px',
                                height: '24px',
                                cursor: 'pointer'
                            }}
                    />
                </div>

                <div style={{ alignSelf: 'flex-start', marginLeft: '50px' }}>
                    <p style={{
                        fontSize: '18px',
                        color:'#757575',
                        fontWeight: 'bold'
                    }}>
                        Quên mật khẩu
                    </p>
                </div>
                
                <div>
                     <button style={styles.btnLogin} ><p style={{fontSize: '28px',fontWeight: 'bold',}}>Đăng nhập</p></button>
                </div>

                <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '800px',
                            margin: '20px 0'
                            }}>
                    <div style={styles.line}></div>
                            <span style={{ margin: '0 10px', color: '#757575', fontWeight: 'bold' }}>
                                Hoặc đăng nhập bằng
                            </span>
                     <div style={styles.line}></div>
                </div>

                <div style={{display:'flex',gap:10}}>
                    <button style={styles.btnIcon}>
                            <img src="/IconGoogle.png" alt="Google" style={styles.imgIcon} />
                    </button>
                    <button style={styles.btnIcon}>
                            <img src="/IconFacebook.png" alt="Facebook" style={styles.imgIcon}/>
                    </button>
                </div>

                <div style={{display:'flex'}}>
                    <p style={{fontWeight:'bold',fontSize:18}}>Chưa có tài khoản ? </p>
                    <p style={{fontWeight:'bold',fontSize:18, color:'#3B82F6'}}> Đăng ký tài khoản mới</p>
                </div>

            </div>
        </div>
        
       
    )
}

export default Home;

const styles ={

    container: {
    backgroundImage: 'url("/Background.png")',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
    

    title: {
        fontSize: '48px',
        fontWeight: 'bold',
        marginBottom: '20px'
    },

    input:{
        width: '800px',
        padding: '12px',
        borderRadius: '27px', 
        border: 'none',
        outline: 'none',
        backgroundColor: 'white', 
        fontSize: '18px',
        color:'#757575',
        fontWeight: 'bold',
        
    },
    input_password:{
      width: '800px',
      padding: '12px 50px 12px 12px', // chừa khoảng trống cho icon
      borderRadius: '27px',
      border: 'none',
      outline: 'none',
      backgroundColor: 'white',
      fontSize: '18px',
      color: '#757575',
      fontWeight: 'bold'
    },

   
  gradientBorder: {
    display: 'inline-block',
    position: 'relative',
    padding: '1px',
    borderRadius: '30px',
    background: 'linear-gradient(to right, #2DE099, #3B82F6)',
  } as React.CSSProperties,

    btnLogin:{
        width: '800px',
        borderRadius: '30px', 
        background: 'linear-gradient(to right, #2DE099, #3B82F6)' ,
        height:'60px',
        cursor: 'pointer',
    },


    line:{
        flex: 1, height: '1px', backgroundColor: 'black'
    },

    btnIcon:{
        width: '150px',
        height: '50px',
        borderRadius: '30px',
        background: 'linear-gradient(to right, #2DE099, #3B82F6)' ,       
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer'
    },

    imgIcon:{
        width: '40px', height: '40px', 
    }
    

}