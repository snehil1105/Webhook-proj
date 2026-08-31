package com.webhook.webhookService.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreateEndpointRequest {

    @NotBlank
    private String name;

    @NotBlank(message= "Must be a valid url")
    private String url;

    @NotEmpty(message= "At least one event type must be selected")
    private List<@Pattern(regexp= "^[a-z]+\\.[a-z_-]+$", message= "Event type must be in the format 'order.shipped'") String> eventTypes;

}
