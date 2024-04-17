const knex = require("../database/knex");
const AppError = require("../utils/AppError");

class MovieNotesController {
  async create(request, response) {
    const { title, description, rating, movieTags } = request.body;
    const { user_id } = request.params;

    const checkRatingMovie = rating >= 1 && rating <= 5;

    if(!checkRatingMovie) {
      throw new AppError("A nota do filme deve ser de 1 a 5!");
    }

    const [note_id] = await knex("movie_notes").insert({
      title,
      description,
      rating,
      user_id
    });

    const movieTagsInsert = movieTags.map(name => {
      return {
        note_id,
        name,
        user_id
      }
    });

    await knex("movie_tags").insert(movieTagsInsert);

    response.json();
  }

  async show(request, response) {
    const { id } = request.params;

    const movieNotes = await knex("movie_notes").where({ id }).first();
    const movieTags = await knex("movie_tags").where({ note_id: id }).orderBy("name");

    if(!movieNotes) {
      throw new AppError("Não existe nota com o ID informado!");
    }

    return response.json({
      ...movieNotes,
      movieTags
    });
  }

  async delete(request, response) {
    const { id } = request.params;

    await knex("movie_notes").where({ id }).delete();

    return response.json();
  }

  async index(request, response) {
    const { user_id, title, movieTags } = request.query;

    let movieNotes;

    if(movieTags) {
      const filterMovieTags = movieTags.split(',').map(movieTag => movieTag.trim());

      movieNotes = await knex("movie_tags")
        .select([
          "movie_notes.id",
          "movie_notes.title",
          "movie_notes.user_id"
        ])
        .where("movie_notes.user_id", user_id)
        .whereLike("movie_notes.title", `%${title}%`)
        .whereIn("name", filterMovieTags)
        .innerJoin("movie_notes", "movie_notes.id", "movie_tags.note_id")
        .orderBy("movie_notes.title")
    } else {
      movieNotes = await knex("movie_notes")
        .where({ user_id })
        .whereLike("title", `%${title}%`)
        .orderBy("title");
    }

    const userTags = await knex("movie_tags").where({ user_id });
    const notesWithTags = movieNotes.map(movieNote => {
      const movieNoteTags = userTags.filter(tag => tag.note_id === movieNote.id);

      return {
        ...movieNote,
        movieTags: movieNoteTags
      }
    });

    response.json(notesWithTags);
  }
}

module.exports = MovieNotesController;