### anti social opinion manager

Local markdown based alternative to Goodreads, Letterboxd, Backloggd etc.

Tracking your opinions about diffrerent things is not only fun but also helps with understanding youself. However all current solutons(mentioned above) tend to lock you into their system and focus on social discovery hence this app.

### How It Works

- asom makes a folder on your computer(probably inside of some cloud folder i.e Dropbox\iCloud Drive). If you already use some markdown based app it can be stored inside your notes folder.
- Inside the asom folder you create subfolders with different schemas.yaml that suit your needs
- Schema is a file that defines what properties exist on each record inside. For example for book that would be author, title, year, read dates, rating, etc.
- Then each record(book\movie\whatever) is a separate markdown file. Attributes defined in schema are stored in frontmatter. asom provides a UI to view, search and edit those files

(yes, you can replicate the same workflow in Obsidian, or use both at the same time)

### Current state

updated: 23 may 2025

Close to being MVP feature complete, needs polish, bugfixes and rewriting messy rust part.
