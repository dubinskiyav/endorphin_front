const CracoAntDesignPlugin = require("craco-antd");
const path = require("path");

process.env.BROWSER = "none";

module.exports = {
  babel: {
    plugins: [
        ["@babel/plugin-proposal-nullish-coalescing-operator"],
	['@babel/plugin-proposal-optional-chaining']
    ]
  },
  webpack: {
    configure: {
      module: {
        rules: [
          {
            type: 'javascript/auto',
            test: /\.mjs$/,
            use: [],
          },
        ],
      },
    },
  },  
  plugins: [
    {
      plugin: require('craco-less'),
      options: {
        lessLoaderOptions: {
          lessOptions: {
            javascriptEnabled: true
          }
        }
      }
    },    
    {
      plugin: CracoAntDesignPlugin,
      options: {
        customizeThemeLessPath: path.join(
          __dirname,
          "src/resources/css/theme.less"
        ),
      }
    },
  ],
};