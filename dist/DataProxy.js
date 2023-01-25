var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class DummyDataProxy {
    fetch(m, queryParams) {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
    create(m, queryParams) {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
    update(m, queryParams) {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
    delete(m, queryParams) {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
    query(collection, queryParams) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = [];
            return res;
        });
    }
}
//# sourceMappingURL=DataProxy.js.map