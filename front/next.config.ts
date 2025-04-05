import type { NextConfig } from "next";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { webpack } from "next/dist/compiled/webpack/webpack";

const nextConfig: NextConfig = {
  webpack: (config: webpack.Configuration) => {
    config.plugins = config.plugins || [];
    config.plugins.push(
      new MiniCssExtractPlugin({
        filename: "static/css/[name].css",
        chunkFilename: "static/css/[id].css",
      })
    );
    
    return config;
  },
};

export default nextConfig;
