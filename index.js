const unirest = require('unirest');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const urlParser = require('url');

function crawlForEmails(queries, resultLimit = 10) {
    // Loop through each query
    queries.forEach(function (query) {
        // The URL of the search engine results page to scrape
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

        // Make a request to the search engine results page with headers
        unirest.get(searchUrl)
          .headers({'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36 Edg/101.0.1210.47', 
          'Accept-Language': 'en-US,en;q=0.9,it;q=0.8,es;q=0.7'})
          .end(function (response) {
            if (response.error) {
                console.log(`Error retrieving search results for ${query}: ${response.error}`);
                return;
            }

            if (response.statusCode != 200) {
                console.log(`Error retrieving search results for ${query}: Status code ${response.statusCode}`);
                return;
            }

            // Output the HTML content of the Google search results page
           //console.log(`HTML content for query "${query}":`, response.body);

            // Load the HTML content into Cheerio
            const $ = cheerio.load(response.body);

            // Extract the URLs of search results
            const searchResults = [];
            const seenLinks = {};

            $('a').each(function() {
              const link = $(this).attr('href');
              if (link && link.startsWith('http') && !link.includes('google.com')) {
                if (!seenLinks[link]) {
                  searchResults.push(link);
                  seenLinks[link] = true;
                }
              }
            });
            

            // Output the URLs of search results
            console.log(`Search results for query "${query}":`, searchResults.slice(0, resultLimit));
            Array.from(searchResults).slice(0, resultLimit).forEach(function (url) {
                crawl(url);
              });
            });
        });

            // Recursive function to crawl a website
  function crawl(url) {
    // Make a request to the URL
    unirest.get(url)
    .headers({'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36 Edg/101.0.1210.47', 
    'Accept-Language': 'en-US,en;q=0.9,it;q=0.8,es;q=0.7',
    'referer': 'https://google.com/'
})
      .end(function (response) {
        if (!response.error && response.statusCode == 200) {
          // Load the HTML content into Cheerio

        //console.log(`HTML content for query "${url}":`, response.body);
        // const hostname = urlParser.parse(url).hostname.replace(/\./g, '');
        // const filename = `${hostname}.txt`;
        // const fileContent = response.body;
        // fs.writeFile(filename, fileContent,{ encoding: 'utf8' }, function (err) {
        //     if (err) throw err;
        //     console.log(`Response body saved to ${filename}`);
        // });

          const $ =cheerio.load(response.body, { decodeEntities: true, xmlMode: false, lowerCaseTags: false, decodeEntities: false, normalizeWhitespace: true, charset: 'utf-8' })

          // Extract any email addresses on the page
          const emails = [];
          $('a[href^="mailto:"]').each(function () {
            const email = $(this).attr('href').replace('mailto:', '');
            emails.push(email);
          });
          if (emails.length > 0) {
            console.log(`Found email(s) on ${url}: ${emails.join(', ')}`);
          } else {
            console.log(`No emails found on ${url}`);
          }

          // Write emails to a file
          if (emails.length > 0) {
            //const hostname = urlParser.parse(url).hostname.replace(/\./g, '');
            const filename = `emails.txt`;
            const fileContent = emails.join('\n');
            fs.writeFile(filename, fileContent, function (err) {
              if (err) throw err;
              console.log(`Email(s) saved to ${filename}`);
            });
          }

          // Find all links on the page and crawl them recursively
          $('a').each(function () {
            const link = $(this).attr('href');
            if (link) {
              const absoluteUrl = urlParser.resolve(url, link);
              if (absoluteUrl.startsWith(url)) {
                crawl(absoluteUrl);
              }
            }
          });
        } else {
          console.log(`Error crawling ${url}: ${response.error}`);
        }
      });
  }
}

// Example usage
crawlForEmails(["419 TEETH", "AC TEETH WHITENING, LLC", "BEAUGICIAN TEETH WHITENING, LLC", "BETTER EDUCATION FOR STRONGER TEETH LLC", "BLEACH BRIGHT TEETH WHITENING OF MIDDLEBURG, LLC"], 4);

  