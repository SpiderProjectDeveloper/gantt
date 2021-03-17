// webpack.config.js
// var BomPlugin = require('webpack-utf8-bom');
const path = require('path');

module.exports = {
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    compress: true,
    port: 9000,
		setup(app) {
			app.get('/server.php', (req, res) => {
				if( req.query.action == 'check_synchronization' ) {
						res.send( JSON.stringify( { synchronized:1 } ) );
				} else if( req.query.action == 'check_lock' ) {
						res.send( JSON.stringify( { locked:1, ganttmtime:111111111111 } ) );
				} else if( req.query.action == 'lock' ) {
						res.send( JSON.stringify( { locked:1, ganttmtime:111111111111 } ) );
				} else if( req.query.action == 'unlock' ) {
						res.send( JSON.stringify( { locked:0, ganttmtime:111111111111 } ) );
				}  
			});

			app.post('/server.php', (req, res) => {
				if( req.query.action == 'store_user_data' ) {
						res.send( JSON.stringify( { errorCode:0 } ) );
				}
			});
		}
  },
  entry: [
    './src/index.js',
  ],
  optimization: {
    minimize: true,
  },
  output: {
	path: path.join(__dirname, '/dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.css$/,
        use: [
			{
				loader: 'style-loader',
			}, 
			{
				loader: 'css-loader',
			}
        ]
      },
      {
        test: /\.html$/,
        loader: "html-loader",
		options: {
			attributes: false,
		},
      }
    ]
  }
};