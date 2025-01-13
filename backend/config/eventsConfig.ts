const ioEvents = {
  listeners: {},
  emitters: {
    game: {
      broadcastHashedServerseed: "game:broadcastHashedServerSeed",
      broadcastCurrentMultiplier: "game:broadcastCurrentMultiplier",
    },
  },
};

export default ioEvents;
