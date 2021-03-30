import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Observable } from "rxjs";
import { startWith, map } from "rxjs/operators";
import { IRadarrProfile, IRadarrRootFolder, ISonarrProfile, ISonarrRootFolder, IUserDropdown, RequestType } from "../../interfaces";
import { IdentityService, MessageService, RadarrService, RequestService, SonarrService } from "../../services";
import { RequestServiceV2 } from "../../services/requestV2.service";

export interface IAdminRequestDialogData {
    type: RequestType,
    id: number
}

@Component({
  selector: "admin-request-dialog",
  templateUrl: "admin-request-dialog.component.html",
  styleUrls: [ "admin-request-dialog.component.scss" ]
})
export class AdminRequestDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<AdminRequestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IAdminRequestDialogData,
    private identityService: IdentityService,
    private sonarrService: SonarrService,
    private radarrService: RadarrService,
    private fb: FormBuilder
  ) {}

  public form: FormGroup;
  public RequestType = RequestType;

  public options: IUserDropdown[];
  public filteredOptions: Observable<IUserDropdown[]>;
  public userId: string;

  public radarrEnabled: boolean;
  public sonarrEnabled: boolean;

  public sonarrProfiles: ISonarrProfile[];
  public sonarrRootFolders: ISonarrRootFolder[];
  public radarrProfiles: IRadarrProfile[];
  public radarrRootFolders: IRadarrRootFolder[];

  public async ngOnInit() {

    this.form = this.fb.group({
        username: [null],
        sonarrPathId: [null],
        sonarrFolderId: [null],
        radarrPathId: [null],
        radarrFolderId: [null]
    })

    this.options = await this.identityService.getUsersDropdown().toPromise();

    this.filteredOptions = this.form.controls['username'].valueChanges.pipe(
      startWith(""),
      map((value) => this._filter(value))
    );

    if (this.data.type === RequestType.tvShow) {
      this.sonarrEnabled = await this.sonarrService.isEnabled();
      if (this.sonarrEnabled) {
        this.sonarrService.getQualityProfilesWithoutSettings().subscribe(c => {
            this.sonarrProfiles = c;
        });
        this.sonarrService.getRootFoldersWithoutSettings().subscribe(c => {
            this.sonarrRootFolders = c;
        });
      }
    }
    if (this.data.type === RequestType.movie) {
        this.radarrEnabled = await this.radarrService.isRadarrEnabled();
        if (this.radarrEnabled) {
            this.radarrService.getQualityProfilesFromSettings().subscribe(c => {
                this.radarrProfiles = c;
            });
            this.radarrService.getRootFoldersFromSettings().subscribe(c => {
                this.radarrRootFolders = c;
            });
        }
    }
  }

  public displayFn(user: IUserDropdown): string {
    const username = user?.username ? user.username : "";
    const email = user?.email ? `(${user.email})` : "";
    return `${username} ${email}`;
  }

  private _filter(value: string | IUserDropdown): IUserDropdown[] {
    const filterValue =
      typeof value === "string"
        ? value.toLowerCase()
        : value.username.toLowerCase();

    return this.options.filter((option) =>
      option.username.toLowerCase().includes(filterValue)
    );
  }

  public async submitRequest() {
      const model = this.form.value;
      model.radarrQualityOverrideTitle =  this.radarrProfiles?.filter(x => x.id == model.radarrPathId)[0]?.name;
      model.radarrRootFolderTitle =  this.radarrRootFolders?.filter(x => x.id == model.radarrFolderId)[0]?.path;
      model.sonarrRootFolderTitle = this.sonarrRootFolders?.filter(x => x.id == model.sonarrFolderId)[0]?.path;
      model.sonarrQualityOverrideTitle = this.sonarrProfiles?.filter(x => x.id == model.sonarrPathId)[0]?.name;
      this.dialogRef.close(model);
  }
}