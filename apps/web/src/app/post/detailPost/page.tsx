import React from "react";
import DetailPost from "./component/DetailPost";

export const metadata = {
  title: "Chi tiết tin đăng",
  description: "Xem chi tiết tin đăng, liên hệ người bán và bình luận",
};

const DetailPostPage: React.FC = () => {
  return (
    <main>
      <DetailPost />
    </main>
  );
};

export default DetailPostPage;
