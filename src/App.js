import React, { Component } from 'react';

//Material UI
import Card from '@material-ui/core/Card';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import withStyles from '@material-ui/core/styles/withStyles';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import FormControl from '@material-ui/core/FormControl';

//Spinner
import { ClipLoader } from 'react-spinners';
import { css } from 'react-emotion';

//superagent for requests
const request = require('superagent');

const override = css`
	display: block;
	margin: 5% 25%;
`;

//Store image currently processing on cloud so the page can render it
let imgToTranslate = '';

const styles = theme => ({
	card: {
		minHeight: '60%',
		maxWidth: '60%',
		padding: '1%'
	},
	answerEntry: {
		marginLeft: '15px',
		width: '35%'
	},
	img: {
		width: '60%',
		float: 'left'
	},
	formControl: {
		margin: theme.spacing.unit,
		minWidth: 120
	},
	selectEmpty: {
		marginTop: theme.spacing.unit * 2
	},
	score: {
		width: '36%',
		position: 'fixed',
		zIndex: 1,
		color: 'white',
		backgroundColor: '#3f51b5',
		textAlign: 'center'
	}
});

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			wordIdentified: '',
			wordTranslated: '',
			language: 'zh-CN',
			name: 'hai',
			answerInput: '',
			score: 0
		};
	}

	componentDidMount() {
		this.getIMG('https://picsum.photos/500/500/?random');
	}

	getIMG = url => {
		const getResourceName = fetch(url)
			.then(response => Promise.all([response.url, response.blob()]))
			.then(([resource, blob]) => {
				this.recognition(resource);
				return resource;
			});

		getResourceName
			.then(res => {
				imgToTranslate = res;
				//Log image source
				// console.log(res);
			})
			.catch(err => console.log(err));
	};

	recognition = src => {
		var b = JSON.stringify({
			requests: [
				{
					image: {
						source: {
							imageUri: src
						}
					},
					features: [
						{
							type: 'LABEL_DETECTION',
							maxResults: 1
						}
					]
				}
			]
		});

		var e = new XMLHttpRequest();

		e.onload = () => {
			//Log image recognition response
			//console.log( 'Word detected:', JSON.parse(e.responseText).responses[0].labelAnnotations[0].description );

			this.setState({
				wordIdentified: JSON.parse(e.responseText).responses[0]
					.labelAnnotations[0].description
			});

			var text = JSON.parse(e.responseText).responses[0].labelAnnotations[0]
				.description;
			var key = 'AIzaSyApkbdj2rRQyrsyPJsS4H1rRnxYNSqa-tA';
			var source = 'en';
			var dest = this.state.language;

			var url = 'https://www.googleapis.com/language/translate/v2?';
			url +=
				'key=' + key + '&source=' + source + '&target=' + dest + '&q=' + text;

			request.get(url).then(result => {
				//Log translation response
				//console.log('Word translated', JSON.parse(result.text).data.translations[0].translatedText);
				this.setState({
					wordTranslated: JSON.parse(result.text).data.translations[0]
						.translatedText
				});
			});
		};
		e.open(
			'POST',
			'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyApkbdj2rRQyrsyPJsS4H1rRnxYNSqa-tA',
			!0
		);
		e.send(b);
	};

	handleChange = event => {
		this.setState({ [event.target.name]: event.target.value });
	};

	submitAnswer = () => {
		if (this.state.answerInput == this.state.wordTranslated) {
			//Correct answer
			this.setState({ score: this.state.score + 1 });
		} else {
			//Incorrect answer
			this.setState({ score: this.state.score - 1 });
		}
		//Clear answer
		this.setState({ answerInput: '' });
		//Fetch new image and start the process again
		this.getIMG('https://picsum.photos/500/500/?random');
	};

	handleChangeInput = event => {
		event.preventDefault();
		this.setState({ [event.target.name]: event.target.value });
	};

	render() {
		const { classes } = this.props;

		return (
			<Card className={classes.card}>
				<div className="sweet-loading">
					<ClipLoader
						className={override}
						sizeUnit={'px'}
						size={250}
						color={'#3f51b5'}
						loading={!imgToTranslate}
					/>
				</div>

				{imgToTranslate && (
					<React.Fragment>
						<Typography className={classes.score}>
							Score: {this.state.score}
						</Typography>
						<img src={imgToTranslate} className={classes.img} />
						<Typography variant="title" align="center" gutterBottom>
							Language Trainer
						</Typography>
						<form className={classes.root} autoComplete="off">
							<FormControl className={classes.answerEntry}>
								<InputLabel htmlFor="language-select">Language</InputLabel>
								<Select
									value={this.state.language}
									onChange={this.handleChange}
									inputProps={{
										name: 'language',
										id: 'language-select'
									}}
								>
									<MenuItem value={'zh-CN'}>Chinese (Simplified)</MenuItem>
									<MenuItem value={'zh-TW'}>Chinese (Traditional)</MenuItem>
									<MenuItem value={'ja'}>Japanese</MenuItem>
									<MenuItem value={'ko'}>Korean</MenuItem>
									<MenuItem value={'mi'}>Māori (te reo)</MenuItem>
									<MenuItem value={'de'}>German</MenuItem>
									<MenuItem value={'es'}>Spanish</MenuItem>
									<MenuItem value={'fr'}>French</MenuItem>
								</Select>
							</FormControl>
						</form>
						<Typography variant="subheading" align="center">
							Word Detected
						</Typography>
						<Typography variant="body1" align="center" gutterBottom>
							{this.state.wordIdentified}
						</Typography>
						<Typography variant="subheading" align="center">
							Answer (hover)
						</Typography>
						<Typography variant="body1" align="center" id="blur">
							{this.state.wordTranslated}
						</Typography>
						<TextField
							className={classes.answerEntry}
							label="Answer"
							name="answerInput"
							value={this.state.answerInput}
							onChange={evt => this.handleChangeInput(evt)}
							margin="normal"
							variant="outlined"
						/>
						<Button
							className={classes.answerEntry}
							variant="contained"
							color="primary"
							onClick={this.submitAnswer}
						>
							Submit
						</Button>
					</React.Fragment>
				)}
			</Card>
		);
	}
}

export default withStyles(styles)(App);
