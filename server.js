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

// News route (existing)
app.get('/news', async (req, res) => {
  try {
    // Fetch world news articles - request 20 to ensure we get 8+ after filtering
    const response = await axios.get('https://newsapi.org/v2/top-headlines?sources=bbc-news&pageSize=20&apiKey=59278959b90f45bbbfee3a42287dbf7b');
    
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
        source: 'BBC News',
        publishedAt: new Date(article.publishedAt).toLocaleString()
      }))
      .slice(0, 8);
    
    // Return articles (should be 8)
    res.json(articles);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).send('Error fetching news');
  }
});

// Tech news route (NEW!)
app.get('/tech', async (req, res) => {
  try {
    const response = await axios.get('https://newsapi.org/v2/top-headlines?category=technology&country=us&pageSize=8&apiKey=59278959b90f45bbbfee3a42287dbf7b');
    
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
        )
      )
      .map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.urlToImage,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt).toLocaleString()
      }))
      .slice(0, 8);
    
    res.json(articles);
  } catch (error) {
    console.error('Error fetching tech news:', error);
    res.status(500).send('Error fetching tech news');
  }
});

// Sports news route (NEW!)
app.get('/sports', async (req, res) => {
  try {
    const response = await axios.get('https://newsapi.org/v2/top-headlines?category=sports&country=gb&pageSize=8&apiKey=59278959b90f45bbbfee3a42287dbf7b');
    
    // Less strict filtering for sports - only exclude extreme content
    const excludedWords = [
      'murder', 'sexual assault', 'rape', 'sex trafficking'
    ];
    
    const articles = response.data.articles
      .filter(article => 
        article.title &&
        !excludedWords.some(word => 
          article.title.toLowerCase().includes(word) || 
          (article.description && article.description.toLowerCase().includes(word))
        )
      )
      .map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.urlToImage,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt).toLocaleString()
      }))
      .slice(0, 8);
    
    res.json(articles);
  } catch (error) {
    console.error('Error fetching sports news:', error);
    res.status(500).send('Error fetching sports news');
  }
});

// Education news route - Scotland/SQA focused (NEW!)
app.get('/education', async (req, res) => {
  try {
    // Go back 90 days (3 months) to find more education articles
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const fromDate = ninetyDaysAgo.toISOString().split('T')[0];
    
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: '(Scotland OR Scottish OR SQA) AND (education OR school OR university OR pupils OR teachers OR exam OR "Higher" OR "National 5" OR curriculum OR college)',
        language: 'en',
        from: fromDate,
        sortBy: 'publishedAt',
        pageSize: 100,
        apiKey: '59278959b90f45bbbfee3a42287dbf7b'
      }
    });
    
    // Filter OUT sports and non-education content
    const excludedWords = [
      'football', 'rugby', 'cricket', 'tennis', 'f1', 'formula 1',
      'premier league', 'champions league', 'world cup', 'olympics',
      'match', 'goal', 'score', 'tournament', 'championship', 'game', 'win', 'defeat',
      'movie', 'film', 'celebrity', 'entertainment', 'music album', 'concert'
    ];
    
    // Keywords that MUST appear for education content
    const requiredWords = [
      'education', 'school', 'university', 'college', 'pupils', 
      'students', 'teachers', 'exam', 'curriculum', 'sqa', 
      'higher', 'national 5', 'learning', 'teaching', 'qualification'
    ];
    
    const articles = response.data.articles
      .filter(article => {
        if (!article.title || !article.description) return false;
        
        const lowerTitle = article.title.toLowerCase();
        const lowerDesc = article.description.toLowerCase();
        const combined = lowerTitle + ' ' + lowerDesc;
        
        // Must NOT contain sports/entertainment words
        const hasBadWords = excludedWords.some(word => combined.includes(word));
        if (hasBadWords) return false;
        
        // Must contain at least ONE education keyword
        const hasEducationWord = requiredWords.some(word => combined.includes(word));
        return hasEducationWord;
      })
      .map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.urlToImage,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt).toLocaleString()
      }))
      .slice(0, 8);
    
    res.json(articles);
  } catch (error) {
    console.error('Error fetching education news:', error);
    res.status(500).send('Error fetching education news');
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
