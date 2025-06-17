import ArtistService from "../services/ArtistService.js";
import { ApiResponse } from "../utils/responses.js";
import { catchAsync } from "../utils/helpers.js";

export const createArtist = catchAsync(async (req, res) => {
  const artist = await ArtistService.createArtist(
    req.body,
    req.file // для одного файла аватара
  );

  res.status(201).json(ApiResponse.success("Артист успешно создан", artist));
});

export const getAllArtists = catchAsync(async (req, res) => {
  const { page, limit, search, genre } = req.query;

  const result = await ArtistService.getAllArtists({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    search,
    genre,
  });

  res.json(
    ApiResponse.paginated(
      "Артисты успешно получены",
      result.artists,
      result.pagination
    )
  );
});

export const getArtistById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const artist = await ArtistService.getArtistById(id);

  res.json(ApiResponse.success("Артист успешно получен", artist));
});

export const getArtistBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const artist = await ArtistService.getArtistBySlug(slug);

  res.json(ApiResponse.success("Артист успешно получен", artist));
});

export const updateArtist = catchAsync(async (req, res) => {
  const { id } = req.params;
  const artist = await ArtistService.updateArtist(id, req.body, req.file);

  res.json(ApiResponse.success("Артист успешно обновлен", artist));
});

export const deleteArtist = catchAsync(async (req, res) => {
  const { id } = req.params;
  const artist = await ArtistService.deleteArtist(id);

  res.json(ApiResponse.success("Артист успешно удален"));
});

export const getArtistTracks = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { page, limit, sortBy, sortOrder } = req.query;

  const result = await ArtistService.getArtistTracks(id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    sortBy: sortBy || "createdAt",
    sortOrder: parseInt(sortOrder) || -1,
  });

  res.json(
    ApiResponse.paginated(
      "Треки артиста успешно получены",
      result.tracks,
      result.pagination
    )
  );
});

export const getArtistAlbums = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { page, limit } = req.query;

  const result = await ArtistService.getArtistAlbums(id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });

  res.json(
    ApiResponse.paginated(
      "Альбомы артиста успешно получены",
      result.albums,
      result.pagination
    )
  );
});

export const searchArtists = catchAsync(async (req, res) => {
  const { query, limit } = req.query;

  const result = await ArtistService.searchArtists(query, {
    limit: parseInt(limit) || 10,
  });

  res.json(ApiResponse.success("Поиск выполнен", result));
});

export const getPopularArtists = catchAsync(async (req, res) => {
  const { limit } = req.query;

  const result = await ArtistService.getPopularArtists({
    limit: parseInt(limit) || 15,
  });

  res.json(ApiResponse.success("Популярные артисты успешно получены", result));
});
