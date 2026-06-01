# Guitar Transcription Catalog UI

A personal development project designed to maintain a database cataloging my decades-spanning collection of 
guitar magazines and song books containing guitar tablature song transcriptions. A UI will be provided to:
- allow users to upload files to the system and associate them with songs and publications
- allow users to browse and search the catalog and view song transcriptions

# Development Information

## Repository Guidelines
Shared repository guidelines and coding standards are maintained in [Repository Guidelines](docs/repository-guidelines.md).

## Build and Operation
See [build and operational details](docs/build-ops-details.md) in the docs folder.

# Specification

## Functional Requirements
User functional requirements detailing required behavior of the application can be found [here](docs/functional-requirements.md).

## Non-Functional Requirements
Non-functional requires detailing non-user requirements are documented [here](docs/non-functional-requirements.md).

## Design

#### Publication Display
* Displayed as a scrolling list where individual publications prominently feature the image of their cover (whether a book or magazine) alongside a list of the transcribed songs in the publication.  
* Have their name prominently featured:  
  - For books of transcriptions, this will be the title.  If an edition is present, that can be as smaller sub text.
  - For magazines, the name should be the name of the serial publication with smaller subtext consisting of the issue name, volume and issue number, if present.
  - All publications should include smaller subtext for the publication's serial number, which should be formatted as an ISBN or ISSN, for books and magazines, respectively.
* Images of the publication cover should be constrained to typically expected proprotions (or aspect ratio) which is US Letter (or 17:22) for magazines and Large Format (or 3:4) for books.  Images should be displayed in the constrained space but fill the constrained area, clipping some of the image potentially, but leaving no gaps.
* User interaction:
  - The publication title area (including subtext) should be clickable which navigates to a detailed [publication view](#publication-view)
  - Transcribed songs listed next to the publication image should be clickable which will navigate to the [transcription view](#transcriptiom-view).
  - At a page level, there should be a button that allows "adding a new publication".  Clicking this will navigate to the [add/edit publication view](#addedit-publication-view).
  - Displayed publications should provide a small button, displayed in the context of each publication 

<!-- ### Song Oriented
A user should be able to display, filter, sort transcribed songs and browse through them (vertical scroll). -->

## UI View Details

### Publication View
* Larger publication cover image
* Publication details - issue name, volume, issue no, edition, publication date, etc.
* List of transcribed songs with additional song details, if the exist, - artist/artist roles, album information on which the song as transcribed is heard (album name, primary artist, relase date, album art), page in the publication on which the transription starts, etc. 
* Listed songs should be clickable which will navigate to the [transcription view](#transcriptiom-view).

### Transcriptiom View
* Displays a header with the song transcription information (publication information, song name, artist information, album, transcriber(s), etc)
* The actual transcription resource (PDF, etc.) is shown below the header and should consume as much width of the screen as possible

### Add/Edit Publication View


  
