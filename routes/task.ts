import express, { Request, Response } from "express";
import { User } from "../models/user";
import { Task } from "../models/task";
import axios from "axios";

const taskRoute = express();

taskRoute.post("/", async (req: Request, res: Response) => {
  try {
    const accessToken = req.body.token;
    const spotifyUserInstance = await User.findOne({ where: { access_token: accessToken } });
    if (!spotifyUserInstance)
      throw new Error("User not found with the given access token");
    const spotifyUser = spotifyUserInstance.get();

    const spotifyId: string = spotifyUser.spotify_id;

    if (!spotifyUser) {
      return res
        .status(404)
        .json({ error: "User not found with the given access token" });
    }

    const taskResponse = await Task.findAll({ where: { spotify_id: spotifyId } });
    const tasks = taskResponse.map((task) => task.get({ plain: true }));

    res.json({data: tasks});
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to fetch tasks from database /tasks" });
  }
});

taskRoute.get("/tasks/:id", async (req: Request, res: Response) => {
  try {
    const { playlistId } = req.params;
    const task = await Task.findOne({ where: { playlist_id: playlistId } });
    res.json(task);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to fetch task from database /tasks/:id" });
  }
});

taskRoute.delete("/tasks/:id", async (req: Request, res: Response) => {
  try {
    const playlistId = req.params.id;
    console.log("PLAYLIST ID FOR DELETE: ", playlistId);
    const task = await Task.findOne({ where: { playlist_id: playlistId } });
    if (task) {
      await task.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to delete task in database /tasks/:id" });
  }
});

taskRoute.get(
  "/tasks/:id/playlistcover",
  async (req: Request, res: Response) => {
    try {
      const { playlistId } = req.params;
      console.log("PLAYLIST ID FOR COVER: ", playlistId);
      const task = await Task.findOne({ where: { playlist_id: playlistId } });
      if (task) {
        const playlistCover = await axios.get(
          `https://api.spotify.com/v1/playlists/${playlistId}/images`
        );
        console.log("PLAYLIST COVER: ", playlistCover);
        res.json({data: playlistCover});
      } else {
        res.status(404).json({ error: "Playlist not found" });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({
          error:
            "Failed to fetch playlist cover from Spotify API /tasks/:id/playlistcover",
        });
    }
  }
);

export default taskRoute;
