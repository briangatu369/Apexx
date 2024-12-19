var crypto = require("crypto");
var UserServices = /** @class */ (function () {
    function UserServices() {
        this.serverSeed = null;
        this.gameSessionHash = null;
        this.hashedServerSeed = null;
    }
    UserServices.prototype.generateServerSeed = function () {
        var serverSeed = crypto.randomBytes(32).toString("hex");
        var hashedServerSeed = crypto
            .createHash("sha256")
            .update(serverSeed)
            .digest("hex");
        this.serverSeed = serverSeed;
        this.hashedServerSeed = hashedServerSeed;
        return { serverSeed: serverSeed, hashedServerSeed: hashedServerSeed };
    };
    UserServices.prototype.generateHash = function (clientSeed) {
        if (!clientSeed || !this.serverSeed) {
            throw new Error("Client seed or server seed is not provided.");
        }
        var combinedSeeds = clientSeed + this.serverSeed;
        var gameSessionHash = crypto
            .createHash("sha256")
            .update(combinedSeeds)
            .digest("hex");
        this.gameSessionHash = gameSessionHash;
        return gameSessionHash;
    };
    UserServices.prototype.calculateMultiplier = function () {
        if (!this.gameSessionHash) {
            throw new Error("Game session was not generated");
        }
        var hashPrefix = this.gameSessionHash.substring(0, 8);
        var numericValue = parseInt(hashPrefix, 16);
        return 5;
    };
    return UserServices;
}());
// Example usage
var userService = new UserServices();
var _a = userService.generateServerSeed(), serverSeed = _a.serverSeed, hashedServerSeed = _a.hashedServerSeed;
console.log("Server Seed:", serverSeed);
console.log("Hashed Server Seed:", hashedServerSeed);
