# Functional Requirements

This document describe high-level functional requirements.  This document does not specify the design of the application that is intended to provide these requirements.

## Overview 
A user should be able to use the application to maintain a catalog of guitar tablature song transcriptions that have been scanned from a collection of guitar magazines and song books (i.e. *publications*). 

At a high level, the user needs to be able to use the UI to:
- upload files of song transcriptions to the system and associate them with songs, publications and various related metadata
- browse and search the catalog in a publication or song centric manner, where the displayed resources list their transcriptions and allow the transcriptions to be viewed

A user should be able to use the website on a computer with large monitors as well as a mobile device or tablet.

## Homepage
A user navigating to the application should be presented with the default view of the catalog, which is [publication centric view](#publication-centric-view).

The user should be able to switch to a [song centric view](#song-centric-view) if they wish.

## Publication Centric View
A user should be able to display, filter, sort all cataloged publications and browse through them (vertical scroll).

Filtering criteria is currently undefined but will be initially limited by available options in the current version of the API.

Multiple publications should be displayed horizontally per in rows, but the design in general should be responsive.

A user should be able to initiate [adding a new publication](#adding-a-publication) from the main view.

A user should be able to initiate [editing of an existing publication](#editing-a-publication) or navigate to detailed publication information.

A user should be able to navigate to a publication's song transcription.

### Adding a publication
A user should be able to add a new magazine issue or book edition.

#### Magazine
For a magazine, a user should be able to specify either of the following:
- A new issue of an existing magazine (existing name and serial number) which includes the following data which is optional unless otherwise specified:
  - Volume (typically a number)
  - Issue (typically a number)
  - Issue name 
  - Publication date
  - Cover image of the issue
  - List of song transcriptions[^1]

- A new issue of a new magazine which includes the following data which is optional unless otherwise specified:
  - Magazine name (required)
  - Serial number, typically ISSN (required)
  - Volume (typically a number)
  - Issue (typically a number)
  - Issue name 
  - Publication date
  - Cover image of the issue
  - List of song transcriptions[^1]

[1]: If supplied, each transcription is described [here](#adding-a-song-transcription)

#### Book
For a book, a user should be able to specify either of the following:
- A new edition of an existing book (existing title and serial number) which includes the following data which is optional unless otherwise specified:
  - Edition
  - Publication date
  - Cover image of the issue
  - List of song transcriptions

- A new book/edition (existing title and serial number) which includes the following data which is optional unless otherwise specified:
  - Book title (required)
  - Serial number, typically ISBN (required)
  - Edition
  - Publication date
  - Cover image of the issue
  - List of song transcriptions

### Editing a Publication
A user should be able to change all elements of a magazine issue or book.

## Song Centric View
A user should be able to display, filter, sort all cataloged song transcriptions and browse through them (vertical scroll).

Filtering criteria is currently undefined but will be initially limited by available options in the current version of the API.

Songs information should be fully diplayed, including related album information (and album art) and transcription transcribers, if available.

A user should be able to intiate [adding a new song transcription](#adding-a-song-transcription) from the main view.

A user should be able to intiate [editing of an existing transcription](#editing-a-song-transcription) or navigate to the transcription view.

### Adding a Song Transcription
A user should be able to add a song transcription to a new or existing magazine issue or book edition.

#### Song Transcription Data
A user should be able to provide the following data for a song transcription.  Optional elements are explicitly noted:
- A publication (see [Specifying a Song Transcription's Publication](#specifying-a-song-transcriptions-publication))
- Page number on which the transcription starts in the publication
- An existing song, or a new song, defined with:
  - Song title
  - A list of song artists (optional), where, if supplied, each is specified by:
    - An existing artist, or a new artist, defined with:
      - Name
      - Artist type (`BAND` or `PERSON`)
    - List of roles the artist serves for the song (`MUSIC_BY`, `PERFORMED_BY`, or `WORDS_BY`)
  - Album information that the song appears on (optional), which consists of:
    - Track number
    - An existing album, or a new album, defined with:
      - Album title
      - Release date (optional)
      - Album cover art (optional)
      - The primary artist (optional), which, if supplied is an existing artist, or new artist, defined with:
        - Name
        - Artist type (`BAND` or `PERSON`)     
- The transcription PDF file
- A list of transcribers (optional), where, if supplied, each is specified by:
  - An existing transcriber, or a new transcriber's name

[^transcriptions-pub]: Specifying a Song Transcription's Publication
A song transcription must be added to a publication.  As such, specifying a publication is the first item required for adding a song transcription.  

  A user should be able to specify an existing publication (magazine issue or book edition) for a song, or if a user wants to add a new publication, they should be able to provide the data as described in the [Adding a Publication](#adding-a-publication) section, excluding the optional list of song transcriptions.

### Editing a Song Transcription
A user should be able to change all elements of song transcription.