import { Auction, StatusAuction } from "../types/auction";
import { CreateAuctionDto } from "../dto/createAuction.dto";
import { EndAuctionDto } from "../dto/endAuction.dto";
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { firestoreApp } from "../firebase/config";
import itemService from "./item.service";
import { Bid } from "../types/bid";
import { SuccessResponse, ErrorResponse } from '../interfaces/response.interface';
import { Item } from "../types/items";
class AuctionService {
  async createAuction(dto: CreateAuctionDto): Promise<SuccessResponse<string> | ErrorResponse> {
    try {
      const now = Timestamp.now();
      const startDate = now;
      const date = new Date(startDate.seconds * 1000);
      date.setMinutes(date.getMinutes() + 5);
      const endDate = Timestamp.fromDate(date);

      let itemData:Item; 
      const result = await itemService.getItem(dto.itemId);
      if (result.success) {
        itemData = result.data;
      } else {
        return result
      }
      const newAuctionData = {
        sellerId: dto.sellerId,
        status: StatusAuction.OPEN,
        startDate,
        endDate,
        item: {
          id: dto.itemId,
          name: itemData.name,
          imgUrl: itemData.imgUrl,
          price: itemData.initial_price,
          quantity: itemData.quantity,
        },
      };

      const auctionCollectionRef = collection(firestoreApp, "auctions");
      const newAuctionRef = await addDoc(auctionCollectionRef, newAuctionData);

      return { success: true, data: newAuctionRef.id };
    } catch (error) {
      console.log("Error creating the auction :", error);
      return { success: false, message: 'Error creating the auction.' };
    }
  }

  async getAuction(auctionId: string): Promise<SuccessResponse<Auction> | ErrorResponse> {
    try {
      const auctionRef = doc(firestoreApp, "auctions", auctionId);
      const auctionSnapshot = await getDoc(auctionRef);

      if (auctionSnapshot.exists()) {
        const auctionData = auctionSnapshot.data();
        return { success: true, data: { id: auctionSnapshot.id, ...auctionData } as Auction };
      } else {
        return { success: false, message: 'Auction not found.' };
      }
    } catch (error) {
      console.log("Error retrieving auction:", error);
      return { success: false, message: 'Error retrieving auction.' };
    }
  }

  async endAuction(dto: EndAuctionDto): Promise<SuccessResponse<null> | ErrorResponse> {

    try {
      const auctionRef = doc(firestoreApp, "auctions", dto.auctionId);
      const result = await this.getAuction(dto.auctionId);
      let auctionData:Auction;
      if (result.success) {
          auctionData = result.data;
      } else {
          return result;
      }

      if (auctionData.status === StatusAuction.OPEN) {
        await updateDoc(auctionRef, { status: StatusAuction.CLOSE });

        return { success: true, data: null };
      } else {
        return { success: false, message:'The auction is already closed.' };
      }
    } catch (error) {
      console.log("Error ending the auction :", error);
      return { success: false, message:'Error ending the auction.' };
    }
  }

  async getActiveAuctions(): Promise<SuccessResponse<Auction[]> | ErrorResponse> {
    try {
      const auctionCollectionRef = collection(firestoreApp, "auctions");
      const q = query(
        auctionCollectionRef,
        where("status", "==", StatusAuction.OPEN)
      );
      const activeAuctionsSnapshot = await getDocs(q);

      let activeAuctions: Auction[] = [];

      activeAuctionsSnapshot.forEach((itemDoc) => {
        activeAuctions.push({ id: itemDoc.id, ...itemDoc.data() } as Auction);
      });
      return { success: true, data: activeAuctions };
    } catch (error) {
      console.log(
        "Error retrieving active auctions :",
        error
      );
      return { success: false, message:'Error retrieving active auctions.' };
    }
  }

  async getAuctionsFromSeller(userId: string): Promise<SuccessResponse<Auction[]> | ErrorResponse> {
    try {
      const auctionCollectionRef = collection(firestoreApp, "auctions");
      const q = query(
        auctionCollectionRef,
        where("sellerId", "==", userId),
        where("status", "==", StatusAuction.OPEN)
      );
      const userAuctionsSnapshot = await getDocs(q);

      const userAuctions: Auction[] = [];

      userAuctionsSnapshot.forEach((itemDoc) => {
        userAuctions.push({ id: itemDoc.id, ...itemDoc.data() } as Auction);
      });
      
      return { success: true, data: userAuctions };
    } catch (error) {
      console.log(
        "Error retrieving auctions associated with the seller:",
        error
      );
      return { success: false, message:'Error retrieving auctions associated with the seller.' };
    }
  }

  async getAuctionsFromBidder(userId: string): Promise<SuccessResponse<Auction[]> | ErrorResponse> {
    try {
        const bidCollectionRef = collection(firestoreApp, "bids");
        const auctionsCollectionRef = collection(firestoreApp, "auctions");
        const auctions: Auction[] = [];
        // Créez une requête pour récupérer les offres de l'utilisateur donné (userId)
        const bidsQuery = query(
            bidCollectionRef,
            where("bidderId", "==", userId)
        );

        // Exécutez la requête et récupérez les offres (bids) correspondantes
        const bidsSnapshot = await getDocs(bidsQuery);

        // Convertissez les données snapshot en tableau d'objets Bid
        const bids: Bid[] = [];
        bidsSnapshot.forEach((bidDoc) => {
            bids.push({ id: bidDoc.id, ...bidDoc.data() } as Bid);
        });
        if (bids.length==0) {
          return { success: true, data: auctions };
        }

        // Récupérez les ID uniques des enchères associées aux offres
        const auctionIds: string[] = Array.from(new Set(bids.map((bid) => bid.auctionId)));

        // Créez une requête pour récupérer les enchères associées aux ID récupérés
        const auctionsQuery = query(
            auctionsCollectionRef,
            where("id", "in", auctionIds),
            where("status","==",StatusAuction.OPEN)
        );

        // Exécutez la requête et récupérez les enchères correspondantes
        const auctionsSnapshot = await getDocs(auctionsQuery);

        // Convertissez les données snapshot en tableau d'objets Auction
        
        auctionsSnapshot.forEach((auctionDoc) => {
            auctions.push({ id: auctionDoc.id, ...auctionDoc.data() } as Auction);
        });

        return { success: true, data: auctions };
    } catch (error) {
        console.log("Error retrieving auctions associated with the bidder.:", error);
        throw error;
    }
  }
  


}

export default new AuctionService();