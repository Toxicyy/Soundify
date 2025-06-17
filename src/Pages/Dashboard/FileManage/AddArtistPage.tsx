import AddArtist from "../../../components/dashboard/file-manager/Artists/AddArtist";

export default function AddArtistPage (){
    return(
         <div
              className="flex flex-col items-center lg:items-start lg:flex-row px-10 py-10 bg-[#F4F4F4] gap-[2vw] overflow-hidden "
              style={{ minHeight: "calc(100vh - 60px)" }}
            >
              <AddArtist />
            </div>
    )
}