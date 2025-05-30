const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the News API!');
});

// News route
app.get('/news', async (req, res) => {
  try {
    // Fetch world news articles
    const response = await axios.get('https://newsapi.org/v2/top-headlines?sources=bbc-news&apiKey=59278959b90f45bbbfee3a42287dbf7b');

    // Expanded excluded words array to include more drug-related terms
    const excludedWords = [
      'murder', 'sexual assault', 'rape', 'drugs', 'drug trafficking', 'sex trafficking', 
      'cannabis', 'marijuana', 'illegal drugs', 'narcotics'
    ];

    const articles = response.data.articles
      .filter(article => 
        article.title &&
        !excludedWords.some(word => 
          article.title.toLowerCase().includes(word) || 
          (article.description && article.description.toLowerCase().includes(word))
        ) &&
        !article.source.name.includes('NFL') && 
        !article.source.name.includes('MLB')
      )
      .map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.urlToImage,
        publishedAt: new Date(article.publishedAt).toLocaleString() // format date
      }))
      .slice(0, 6); // Get only the first 6 unique articles

    // Ensure there are exactly 6 articles, fill with empty objects if needed
    while (articles.length < 6) {
      articles.push({
        title: 'No title available',
        description: 'No description available',
        url: '',
        image: '',
        publishedAt: ''
      });
    }

    res.json(articles);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).send('Error fetching news');
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
